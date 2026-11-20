import { EmbeddingStatus, Prisma, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'did', 'do', 'for', 'from', 'get',
  'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'our',
  'please', 'tell', 'that', 'the', 'this', 'to', 'was', 'we', 'were', 'what',
  'when', 'where', 'who', 'with', 'you', 'your'
]);

const CONCEPT_ALIASES: Record<string, string> = {
  wed: 'wedding', married: 'wedding', marriage: 'wedding', bride: 'wedding', groom: 'wedding',
  degree: 'graduation', graduate: 'graduation', graduated: 'graduation', university: 'graduation', college: 'graduation',
  child: 'childhood', young: 'childhood', schooldays: 'school',
  dad: 'father', papa: 'father', mum: 'mother', mom: 'mother', mama: 'mother',
  spouse: 'partner', wife: 'partner', husband: 'partner',
  holiday: 'travel', vacation: 'travel', trip: 'travel', journey: 'travel', toured: 'travel',
  seaside: 'beach', ocean: 'beach', sea: 'beach', shore: 'beach',
  work: 'career', job: 'career', office: 'career', company: 'career',
  house: 'home', residence: 'home',
  photograph: 'photo', photographs: 'photo', picture: 'photo', pictures: 'photo',
  celebration: 'festival', celebrated: 'festival',
  bike: 'bicycle', cycle: 'bicycle',
  grandson: 'grandchild', granddaughter: 'grandchild',
  receive: 'received', receiving: 'received'
};

function stem(token: string): string {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function semanticTerms(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map((token) => CONCEPT_ALIASES[token] || CONCEPT_ALIASES[stem(token)] || stem(token));
}

function hashTerm(term: string): number {
  let hash = 2166136261;
  for (let index = 0; index < term.length; index += 1) {
    hash ^= term.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class LocalSemanticEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'local-semantic-v2';
  readonly dimensions = 256;

  async embed(text: string): Promise<number[]> {
    const vector = Array<number>(this.dimensions).fill(0);
    for (const term of semanticTerms(text)) {
      vector[hashTerm(term) % this.dimensions] += 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
  }
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function conceptCoverage(query: string, document: string): number {
  const queryTerms = new Set(semanticTerms(query));
  if (queryTerms.size === 0) return 0;
  const documentTerms = new Set(semanticTerms(document));
  let matches = 0;
  for (const term of queryTerms) {
    if (documentTerms.has(term)) matches += 1;
  }
  return matches / queryTerms.size;
}

type RetrievalMemory = Prisma.MemoryGetPayload<{
  include: {
    people: {
      include: {
        person: {
          include: {
            relationshipsAsOne: { select: { relationshipType: true; description: true } };
            relationshipsAsTwo: { select: { relationshipType: true; description: true } };
          };
        };
      };
    };
    album: true;
    media: {
      select: { id: true; mediaType: true; fileName: true; mimeType: true; caption: true };
    };
  };
}>;

function memoryDocument(memory: RetrievalMemory): string {
  const title = `${memory.title} ${memory.title} ${memory.title}`;
  const tags = `${memory.tags.join(' ')} ${memory.tags.join(' ')}`;
  return [
    title,
    tags,
    memory.description,
    memory.story,
    memory.audioDescription,
    memory.location,
    memory.era,
    memory.eventType,
    memory.approximateYear?.toString(),
    memory.album?.title,
    memory.people.map((entry) => [
      entry.person.fullName,
      ...entry.person.relationshipsAsOne.flatMap((relation) => [relation.relationshipType, relation.description]),
      ...entry.person.relationshipsAsTwo.flatMap((relation) => [relation.relationshipType, relation.description])
    ].filter(Boolean).join(' ')).join(' ')
  ].filter(Boolean).join(' ');
}

export class EmbeddingService {
  constructor(private readonly provider: EmbeddingProvider = new LocalSemanticEmbeddingProvider()) {}

  async embedVerifiedMemory(memoryId: string): Promise<void> {
    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        deletedAt: null,
        verificationStatus: VerificationStatus.VERIFIED
      },
      include: {
        people: {
          include: {
            person: {
              include: {
                relationshipsAsOne: { select: { relationshipType: true, description: true } },
                relationshipsAsTwo: { select: { relationshipType: true, description: true } }
              }
            }
          }
        },
        album: true,
        media: {
          where: { deletedAt: null },
          select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
        }
      }
    });
    if (!memory) return;

    const embedding = await this.provider.embed(memoryDocument(memory));
    await prisma.memory.updateMany({
      where: { id: memoryId, verificationStatus: VerificationStatus.VERIFIED, deletedAt: null },
      data: {
        embedding,
        embeddingStatus: EmbeddingStatus.READY,
        embeddingModel: this.provider.name,
        embeddingUpdatedAt: new Date()
      }
    });
  }

  async retrieveVerified(patientId: string, query: string, limit = 3) {
    const memories = await prisma.memory.findMany({
      where: {
        patientId,
        deletedAt: null,
        verificationStatus: VerificationStatus.VERIFIED
      },
      include: {
        people: {
          include: {
            person: {
              include: {
                relationshipsAsOne: { select: { relationshipType: true, description: true } },
                relationshipsAsTwo: { select: { relationshipType: true, description: true } }
              }
            }
          }
        },
        album: true,
        media: {
          where: { deletedAt: null },
          select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const queryEmbedding = await this.provider.embed(query);
    const scored = await Promise.all(memories.map(async (memory) => {
      let embedding = memory.embedding;
      if (
        memory.embeddingStatus !== EmbeddingStatus.READY ||
        memory.embeddingModel !== this.provider.name ||
        embedding.length !== this.provider.dimensions
      ) {
        embedding = await this.provider.embed(memoryDocument(memory));
        await prisma.memory.updateMany({
          where: { id: memory.id, verificationStatus: VerificationStatus.VERIFIED, deletedAt: null },
          data: {
            embedding,
            embeddingStatus: EmbeddingStatus.READY,
            embeddingModel: this.provider.name,
            embeddingUpdatedAt: new Date()
          }
        });
      }
      return {
        memory,
        score: cosineSimilarity(queryEmbedding, embedding),
        coverage: conceptCoverage(query, memoryDocument(memory))
      };
    }));

    return scored
      .filter(({ score, coverage }) =>
        score >= env.MEMORY_RETRIEVAL_THRESHOLD &&
        coverage >= env.MEMORY_RETRIEVAL_MIN_COVERAGE
      )
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  get metadata() {
    return {
      provider: env.EMBEDDING_PROVIDER,
      model: this.provider.name,
      dimensions: this.provider.dimensions,
      threshold: env.MEMORY_RETRIEVAL_THRESHOLD,
      minCoverage: env.MEMORY_RETRIEVAL_MIN_COVERAGE
    };
  }
}

export const embeddingService = new EmbeddingService();
