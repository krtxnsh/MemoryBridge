import { VerificationStatus, SenderType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { formatDisplayTime } from './routine.service.js';
import { embeddingService } from './embedding.service.js';
import { generateGroundedReply, getLlmProvider } from './llm/index.js';

const UNKNOWN_MEMORY_REPLY =
  "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";

export class CompanionService {
  async getState(patientId: string) {
    const patient = await prisma.patientProfile.findFirst({
      where: { id: patientId, deletedAt: null }
    });

    if (!patient) {
      throw new AppError('PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
    }

    const firstName = patient.fullName.split(' ')[0] || patient.fullName;

    // Parallel count queries
    const [verifiedMemoryCount, routineCount, latestConversation] = await Promise.all([
      prisma.memory.count({
        where: { patientId, deletedAt: null, verificationStatus: VerificationStatus.VERIFIED }
      }),
      prisma.routineItem.count({
        where: { patientId, completed: false }
      }),
      prisma.conversation.findFirst({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })
    ]);

    return {
      patientName: patient.fullName,
      firstName,
      mascotState: 'friendly',
      welcomeMessage: `Hello ${firstName}! Would you like to revisit a beautiful memory together today?`,
      suggestedPrompts: [
        'Tell me about my family',
        'What happened on my wedding day?',
        'Tell me about my childhood',
        "Let's check my routine for today"
      ],
      verifiedMemoryCount,
      upcomingRoutineCount: routineCount,
      recentConversationId: latestConversation?.id || null,
      explanation: (() => {
        const llm = getLlmProvider();
        return llm
          ? `Rule-based memory companion with verified semantic retrieval, phrased by the ${llm.name} LLM (grounded, verified-memory only).`
          : 'Rule-based memory companion with verified semantic retrieval';
      })()
    };
  }

  async processMessage(
    patientId: string,
    text: string,
    context?: { screen?: string },
    actor?: { userId?: string; patientSessionId?: string }
  ) {
    const patient = await prisma.patientProfile.findFirst({
      where: { id: patientId, deletedAt: null }
    });

    if (!patient) {
      throw new AppError('PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
    }

    const firstName = patient.fullName.split(' ')[0] || patient.fullName;
    const lowerText = text.toLowerCase();

    // 1. Search only VERIFIED memories inside the active patient workspace.
    const [retrievedMemories, promptMemories] = await Promise.all([
      embeddingService.retrieveVerified(patientId, text, 3),
      prisma.memory.findMany({
        where: {
          patientId,
          deletedAt: null,
          verificationStatus: VerificationStatus.VERIFIED
        },
        select: { title: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
    ]);

    // 2. Fetch Routine items
    const routineItems = await prisma.routineItem.findMany({
      where: { patientId },
      orderBy: { scheduledTime: 'asc' }
    });

    // 3. Routine intent detection
    const isRoutineQuery =
      lowerText.includes('routine') ||
      lowerText.includes('schedule') ||
      lowerText.includes('medicine') ||
      lowerText.includes('pill') ||
      lowerText.includes('walk') ||
      lowerText.includes('lunch') ||
      lowerText.includes('dinner') ||
      lowerText.includes('breakfast');

    const matchedRoutine = isRoutineQuery
      ? routineItems
          .filter((r) => !r.completed)
          .sort((a, b) => {
            const aWords = a.title.toLowerCase().split(/\s+/);
            const bWords = b.title.toLowerCase().split(/\s+/);
            const aMatch = aWords.some((w) => w.length > 3 && lowerText.includes(w));
            const bMatch = bWords.some((w) => w.length > 3 && lowerText.includes(w));
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return a.scheduledTime.localeCompare(b.scheduledTime);
          })
      : [];

    // 4. Formulate a deterministic, grounded companion response.
    let reply = '';
    const suggestedMemories = retrievedMemories.map(({ memory }) => memory);
    const topRetrieval = retrievedMemories[0] || null;
    const suggestedRoutine = matchedRoutine.slice(0, 3);
    const answerRetrieval = isRoutineQuery && suggestedRoutine.length > 0 ? null : topRetrieval;

    // Grounded facts: the ONLY material an LLM is ever allowed to rephrase.
    const groundedFacts: string[] = [];

    if (isRoutineQuery && suggestedRoutine.length > 0) {
      const nextItem = suggestedRoutine[0];
      reply = `Let's check your schedule, ${firstName}. You have "${nextItem.title}" coming up at ${formatDisplayTime(nextItem.scheduledTime)}. We can take our time and do it together!`;
      for (const item of suggestedRoutine) {
        groundedFacts.push(`You have "${item.title}" scheduled at ${formatDisplayTime(item.scheduledTime)}.`);
      }
    } else if (suggestedMemories.length > 0) {
      const topMem = suggestedMemories[0];
      const groundedDetail = topMem.description || topMem.story;
      reply = `Your family storybook has a verified memory called "${topMem.title}" from ${topMem.approximateYear || topMem.era}. ${groundedDetail} Would you like to look at the photos together?`;
      for (const mem of suggestedMemories.slice(0, 2)) {
        const when = mem.approximateYear || mem.era || '';
        const where = mem.location ? `, ${mem.location}` : '';
        const people = (mem.people || [])
          .map((p: any) => p.person?.fullName)
          .filter(Boolean)
          .join(', ');
        const peoplePart = people ? ` With ${people}.` : '';
        groundedFacts.push(
          `"${mem.title}"${when ? ` (${when}${where})` : where}: ${mem.description || mem.story}.${peoplePart}`.trim()
        );
      }
    } else {
      // Never substitute an unrelated memory or invent a family fact.
      reply = UNKNOWN_MEMORY_REPLY;
    }

    // 5. Optional LLM phrasing layer. The LLM only ever rephrases the grounded
    // facts above; when there are no facts (fallback case) it is never called, so
    // it can never invent personal history, override verification, or leak a
    // pending memory. Any provider error/timeout keeps the deterministic reply.
    let answerSource: 'llm' | 'rule_based' | 'fallback' =
      groundedFacts.length > 0 ? 'rule_based' : 'fallback';
    let llmMeta: { provider: string; model: string; latencyMs: number } | null = null;

    if (groundedFacts.length > 0) {
      const phrased = await generateGroundedReply({
        firstName,
        question: text,
        facts: groundedFacts
      });
      if (phrased) {
        reply = phrased.text;
        answerSource = 'llm';
        llmMeta = { provider: phrased.provider, model: phrased.model, latencyMs: phrased.latencyMs };
      }
    }

    // 6. Record conversation turn transactionally
    const conversation = await prisma.$transaction(async (tx) => {
      // Find or create conversation
      let conv = await tx.conversation.findFirst({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
      });

      if (!conv) {
        conv = await tx.conversation.create({
          data: {
            patientId,
            userId: actor?.userId || null,
            patientSessionId: actor?.patientSessionId || null
          }
        });
      }

      // Record User Message
      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderType: SenderType.USER,
          messageText: text
        }
      });

      // Record Companion Message
      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderType: SenderType.COMPANION,
          messageText: reply,
          relatedMemoryId: answerRetrieval?.memory.id || null,
          retrievalScore: answerRetrieval?.score || null
        }
      });

      return conv;
    });

    const serializedMemories = suggestedMemories.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      story: m.story,
      eventDate: m.eventDate,
      approximateYear: m.approximateYear,
      location: m.location,
      era: m.era,
      verificationStatus: m.verificationStatus,
      album: m.album,
      people: m.people.map((p) => ({
        id: p.person.id,
        fullName: p.person.fullName,
        profileImage: p.person.profileImage
      })),
      retrievalScore: retrievedMemories.find((result) => result.memory.id === m.id)?.score || null,
      media: m.media.map((med) => ({
        id: med.id,
        mediaType: med.mediaType,
        fileName: med.fileName,
        mimeType: med.mimeType,
        caption: med.caption,
        url: null
      }))
    }));

    return {
      conversationId: conversation.id,
      reply,
      memoryCard: serializedMemories[0] || null,
      suggestedMemories: serializedMemories,
      suggestedPrompts: promptMemories.map((memory) => `Tell me about ${memory.title}`),
      suggestedRoutine: suggestedRoutine.map((r) => ({
        id: r.id,
        title: r.title,
        scheduledTime: r.scheduledTime,
        displayTime: formatDisplayTime(r.scheduledTime),
        period: r.period,
        category: r.category,
        completed: r.completed
      })),
      retrieval: answerRetrieval ? {
        supportingMemoryId: answerRetrieval.memory.id,
        score: answerRetrieval.score,
        ...embeddingService.metadata
      } : {
        supportingMemoryId: null,
        score: null,
        ...embeddingService.metadata
      },
      // Provenance so the UI can tell the patient/caregiver where the answer came
      // from: 'llm' (grounded phrasing), 'rule_based' (deterministic template from
      // verified facts), or 'fallback' (no verified memory — honest "I don't know").
      answerSource,
      grounding: {
        source: answerSource,
        usedVerifiedMemory: Boolean(answerRetrieval),
        supportingMemoryId: answerRetrieval?.memory.id || null,
        llm: llmMeta
      },
      explanation:
        answerSource === 'fallback'
          ? 'No verified memory matched; returned the safe fallback without generating any content.'
          : answerSource === 'llm'
            ? `Answer phrased by the ${llmMeta?.provider} LLM strictly from verified memory facts (grounded, no invention).`
            : 'Deterministic companion grounded by verified semantic memory retrieval.'
    };
  }
}

export const companionService = new CompanionService();
