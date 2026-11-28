import { VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { generateNarration } from './llm/index.js';

const UNKNOWN_MEMORY_REPLY =
  "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";

// Relationship words the patient might use -> the relationshipType stored in the
// Relationship table (personTwo is personOne's {relationshipType}).
const RELATION_SYNONYMS: Record<string, string[]> = {
  mother: ['mother', 'amma', 'mom', 'mum', 'mummy'],
  father: ['father', 'appa', 'dad', 'daddy', 'papa'],
  spouse: ['wife', 'husband', 'spouse'],
  sister: ['sister'],
  brother: ['brother'],
  son: ['son'],
  daughter: ['daughter'],
  friend: ['friend', 'best friend'],
  teacher: ['teacher', 'master'],
  grandson: ['grandson'],
  granddaughter: ['granddaughter']
};

// Era words -> the set of `era` values used in the data.
const ERA_KEYWORDS: Array<{ match: RegExp; eras: string[]; label: string }> = [
  { match: /\b(childhood|growing up|as a (little )?(boy|child)|young boy|little boy)\b/, eras: ['Childhood'], label: 'your childhood' },
  { match: /\b(school|schooldays|school days|classroom)\b/, eras: ['School'], label: 'your school days' },
  { match: /\b(college|university|student days)\b/, eras: ['College'], label: 'your college days' },
  { match: /\b(first job|early career|young man)\b/, eras: ['Early Career', 'College'], label: 'your early working years' },
  { match: /\b(wedding years|marriage|got married|married life|newly married)\b/, eras: ['Marriage'], label: 'your marriage' },
  { match: /\b(young family|the children|raising|when the kids)\b/, eras: ['Young Family'], label: 'your young family years' },
  { match: /\b(career|working years|work life|middle (of your )?life)\b/, eras: ['Middle Life', 'Early Career'], label: 'your working years' },
  { match: /\b(retirement|retired)\b/, eras: ['Retirement'], label: 'your retirement' },
  { match: /\b(grandchild|grandchildren|grandkids|grandparent|grand-?kids)\b/, eras: ['Grandparent Years'], label: 'your grandparent years' }
];

const LIFE_PATTERNS =
  /\b(life story|whole life|your (whole |entire )?life|about (my|your) life|story of (my|your) life|tell me about (my|your) life|about (my|your) family|tell me about (my|your) family)\b/;

// A narration cue signals "please narrate / recall", so we don't hijack unrelated
// mentions of a person (e.g. "is my son coming today").
const NARRATION_CUE =
  /\b(tell me|tell us|about|remember|recall|story|share|talk about|growing up|what (was|were)|who (was|were))\b/;

export type NarrationScope =
  | { kind: 'life'; label: string }
  | { kind: 'era'; label: string; eras: string[] }
  | { kind: 'person'; label: string; relationKey: string; synonym: string };

export function detectNarrationScope(text: string): NarrationScope | null {
  const t = text.toLowerCase();

  if (LIFE_PATTERNS.test(t)) {
    return { kind: 'life', label: 'your life story' };
  }

  // Person scope (requires a narration cue to avoid false positives).
  if (NARRATION_CUE.test(t)) {
    for (const [relationKey, synonyms] of Object.entries(RELATION_SYNONYMS)) {
      const hit = synonyms.find((s) => new RegExp(`\\b${s}\\b`).test(t));
      if (hit) {
        return { kind: 'person', label: `your ${hit}`, relationKey, synonym: hit };
      }
    }
    // Era scope
    for (const e of ERA_KEYWORDS) {
      if (e.match.test(t)) {
        return { kind: 'era', label: e.label, eras: e.eras };
      }
    }
  }

  return null;
}

const memoryInclude = {
  people: { include: { person: true } },
  album: true,
  media: {
    where: { deletedAt: null },
    select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
  }
} as const;

async function fetchVerified(patientId: string) {
  return prisma.memory.findMany({
    where: { patientId, deletedAt: null, verificationStatus: VerificationStatus.VERIFIED },
    include: memoryInclude
  });
}

function sortChronologically<T extends { approximateYear: number | null; eventDate: Date | null }>(mems: T[]): T[] {
  return [...mems].sort((a, b) => {
    const ya = a.approximateYear ?? (a.eventDate ? a.eventDate.getFullYear() : 9999);
    const yb = b.approximateYear ?? (b.eventDate ? b.eventDate.getFullYear() : 9999);
    if (ya !== yb) return ya - yb;
    const da = a.eventDate ? a.eventDate.getTime() : 0;
    const db = b.eventDate ? b.eventDate.getTime() : 0;
    return da - db;
  });
}

/** Resolve the people ids that match a relationship word for this patient. */
async function resolvePeopleForRelation(patientId: string, relationKey: string): Promise<Set<string>> {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { personId: true }
  });
  const ids = new Set<string>();
  if (!patient?.personId) return ids;

  const rels = await prisma.relationship.findMany({ where: { patientId } });
  const want = (type: string) => {
    const tl = type.toLowerCase();
    switch (relationKey) {
      case 'mother': return tl === 'mother';
      case 'father': return tl === 'father';
      case 'spouse': return tl === 'spouse';
      case 'sister': return tl === 'sister';
      case 'brother': return tl === 'brother';
      case 'son': return tl === 'son';
      case 'daughter': return tl === 'daughter';
      case 'friend': return tl === 'friend';
      case 'teacher': return tl === 'teacher';
      case 'grandson': return tl === 'grandson';
      case 'granddaughter': return tl === 'granddaughter';
      default: return false;
    }
  };
  for (const r of rels) {
    if (r.personOneId === patient.personId && want(r.relationshipType)) ids.add(r.personTwoId);
    if (r.personTwoId === patient.personId && want(r.relationshipType)) ids.add(r.personOneId);
  }
  return ids;
}

export interface GatheredStory {
  memories: any[]; // verified, chronological (scope + linked)
  connectionNotes: string[];
}

/**
 * Gather verified memories for a scope, sorted chronologically, and follow the
 * curated related-memory links (one hop) so connected memories and their
 * "connection notes" can be woven in. Only VERIFIED memories ever enter the set.
 */
export async function gatherScopedMemories(patientId: string, scope: NarrationScope): Promise<GatheredStory> {
  const allVerified = await fetchVerified(patientId);
  const verifiedById = new Map(allVerified.map((m) => [m.id, m]));

  let base: any[];
  if (scope.kind === 'life') {
    base = allVerified;
  } else if (scope.kind === 'era') {
    const eras = new Set(scope.eras.map((e) => e.toLowerCase()));
    base = allVerified.filter((m) => m.era && eras.has(m.era.toLowerCase()));
  } else {
    const people = await resolvePeopleForRelation(patientId, scope.relationKey);
    base = allVerified.filter((m) => (m.people || []).some((p: any) => people.has(p.personId)));
  }

  const selected = new Map<string, any>(base.map((m) => [m.id, m]));

  // Follow curated links one hop (only to verified memories), and collect the
  // connection notes whose endpoints are both in our final set.
  const links = await prisma.memoryLink.findMany({
    where: {
      patientId,
      OR: [
        { fromMemoryId: { in: base.map((m) => m.id) } },
        { toMemoryId: { in: base.map((m) => m.id) } }
      ]
    }
  });

  if (scope.kind !== 'life') {
    for (const link of links) {
      for (const otherId of [link.fromMemoryId, link.toMemoryId]) {
        const mem = verifiedById.get(otherId);
        if (mem && !selected.has(otherId)) selected.set(otherId, mem);
      }
    }
  }

  const memories = sortChronologically(Array.from(selected.values()));

  const connectionNotes: string[] = [];
  for (const link of links) {
    if (selected.has(link.fromMemoryId) && selected.has(link.toMemoryId)) {
      connectionNotes.push(link.connectionNote);
    }
  }

  return { memories, connectionNotes };
}

function peopleNames(m: any): string {
  return (m.people || [])
    .map((p: any) => p.person?.fullName)
    .filter((n: string) => n && n.toLowerCase() !== 'gopal')
    .join(', ');
}

/** Build grounded fact lines for the narration prompt (chronological + notes). */
function buildFacts(memories: any[], connectionNotes: string[]): string[] {
  // Keep the prompt digestible: for very long lives, evenly sample the timeline.
  let chosen = memories;
  const MAX = 14;
  if (memories.length > MAX) {
    const step = memories.length / MAX;
    chosen = Array.from({ length: MAX }, (_, i) => memories[Math.floor(i * step)]);
  }
  const factLines = chosen.map((m) => {
    const year = m.approximateYear || (m.eventDate ? m.eventDate.getFullYear() : '');
    const names = peopleNames(m);
    const whoPart = names ? ` (with ${names})` : '';
    return `(${year}) ${m.title}${whoPart}: ${m.story}`;
  });
  const noteLines = connectionNotes.slice(0, 8).map((n) => `Connection: ${n}`);
  return [...factLines, ...noteLines];
}

/** Deterministic, LLM-free narration built only from verified memory content. */
function deterministicStory(firstName: string, scopeLabel: string, memories: any[], connectionNotes: string[]): string {
  let chosen = memories;
  const MAX = 10;
  if (memories.length > MAX) {
    const step = memories.length / MAX;
    chosen = Array.from({ length: MAX }, (_, i) => memories[Math.floor(i * step)]);
  }
  const intro = `Let's look back together at ${scopeLabel}, ${firstName}.`;
  const body = chosen.map((m) => m.story.trim()).join(' ');
  const thread = connectionNotes.slice(0, 2).join(' ');
  const outro = `What a warm journey it has been, ${firstName}. Would you like to look at the photographs together?`;
  return [intro, body, thread, outro].filter(Boolean).join(' ');
}

export interface NarrationResult {
  reply: string;
  answerSource: 'llm' | 'rule_based' | 'fallback';
  scopeLabel: string;
  usedMemoryIds: string[];
  supportingMemoryId: string | null;
  llm: { provider: string; model: string; latencyMs: number } | null;
  /** The verified memories used (chronological), for rendering memory cards. */
  memories: any[];
}

/**
 * Entry point: if `text` is a life-story / era / person narration request,
 * produce a grounded narration. Returns null when it is NOT a narration intent
 * (so the caller falls back to the normal companion flow).
 *
 * Safety: only VERIFIED memories are used. If the scope has no verified memories,
 * the exact safe fallback is returned and the LLM is NOT called.
 */
export async function buildNarration(
  patientId: string,
  text: string,
  firstName: string
): Promise<NarrationResult | null> {
  const scope = detectNarrationScope(text);
  if (!scope) return null;

  const { memories, connectionNotes } = await gatherScopedMemories(patientId, scope);

  if (memories.length === 0) {
    // Nothing verified for this scope — never narrate, never call the LLM.
    return {
      reply: UNKNOWN_MEMORY_REPLY,
      answerSource: 'fallback',
      scopeLabel: scope.label,
      usedMemoryIds: [],
      supportingMemoryId: null,
      llm: null,
      memories: []
    };
  }

  const usedMemoryIds = memories.map((m) => m.id);
  const facts = buildFacts(memories, connectionNotes);

  const phrased = await generateNarration({ firstName, scopeLabel: scope.label, facts });
  if (phrased) {
    return {
      reply: phrased.text,
      answerSource: 'llm',
      scopeLabel: scope.label,
      usedMemoryIds,
      supportingMemoryId: usedMemoryIds[0] || null,
      llm: { provider: phrased.provider, model: phrased.model, latencyMs: phrased.latencyMs },
      memories
    };
  }

  return {
    reply: deterministicStory(firstName, scope.label, memories, connectionNotes),
    answerSource: 'rule_based',
    scopeLabel: scope.label,
    usedMemoryIds,
    supportingMemoryId: usedMemoryIds[0] || null,
    llm: null,
    memories
  };
}
