import { VerificationStatus, SenderType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { formatDisplayTime } from './routine.service.js';

const UNKNOWN_MEMORY_REPLY =
  "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";

const SEARCH_STOP_WORDS = new Set([
  'about', 'again', 'could', 'from', 'have', 'memory', 'please', 'show',
  'tell', 'that', 'their', 'there', 'this', 'what', 'when', 'where', 'which',
  'with', 'would', 'your'
]);

function searchTerms(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2 && !SEARCH_STOP_WORDS.has(term));
}

function countMatches(queryTerms: string[], value: string | null | undefined): number {
  if (!value) return 0;
  const valueTerms = new Set(searchTerms(value));
  return queryTerms.reduce((count, term) => count + (valueTerms.has(term) ? 1 : 0), 0);
}

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
      explanation: 'Rule-based memory companion (LLM integration deferred)'
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

    // 1. Fetch VERIFIED memories for this patient only
    const verifiedMemories = await prisma.memory.findMany({
      where: {
        patientId,
        deletedAt: null,
        verificationStatus: VerificationStatus.VERIFIED
      },
      include: {
        people: { include: { person: true } },
        album: true,
        media: {
          where: { deletedAt: null },
          select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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

    // 4. Weighted lexical retrieval over VERIFIED memories only. This gives the
    // local app Clariti-style natural-language recall without sending private
    // family data to an external model or claiming a match when confidence is low.
    const queryTerms = searchTerms(text);
    const matchedMemories = verifiedMemories
      .map((memory) => {
        const score =
          countMatches(queryTerms, memory.title) * 5 +
          countMatches(queryTerms, memory.tags.join(' ')) * 4 +
          countMatches(queryTerms, memory.people.map((entry) => entry.person.fullName).join(' ')) * 4 +
          countMatches(queryTerms, memory.location) * 3 +
          countMatches(queryTerms, memory.era) * 2 +
          countMatches(queryTerms, memory.description) * 2 +
          countMatches(queryTerms, memory.story);

        return { memory, score };
      })
      .filter(({ score }) => score >= 3)
      .sort((a, b) => b.score - a.score)
      .map(({ memory }) => memory);

    // 5. Formulate deterministic companion response
    let reply = '';
    const suggestedMemories = matchedMemories.slice(0, 3);
    const suggestedRoutine = matchedRoutine.slice(0, 3);

    if (isRoutineQuery && suggestedRoutine.length > 0) {
      const nextItem = suggestedRoutine[0];
      reply = `Let's check your schedule, ${firstName}. You have "${nextItem.title}" coming up at ${formatDisplayTime(nextItem.scheduledTime)}. We can take our time and do it together!`;
    } else if (suggestedMemories.length > 0) {
      const topMem = suggestedMemories[0];
      const groundedDetail = topMem.description || topMem.story;
      reply = `Your family storybook has a verified memory called "${topMem.title}" from ${topMem.approximateYear || topMem.era}. ${groundedDetail} Would you like to look at the photos together?`;
    } else {
      // Never substitute an unrelated memory or invent a family fact.
      reply = UNKNOWN_MEMORY_REPLY;
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
          relatedMemoryId: suggestedMemories[0]?.id || null
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
      suggestedPrompts: verifiedMemories.slice(0, 3).map((memory) => `Tell me about ${memory.title}`),
      suggestedRoutine: suggestedRoutine.map((r) => ({
        id: r.id,
        title: r.title,
        scheduledTime: r.scheduledTime,
        displayTime: formatDisplayTime(r.scheduledTime),
        period: r.period,
        category: r.category,
        completed: r.completed
      })),
      explanation: 'Rule-based memory companion (LLM integration deferred)'
    };
  }
}

export const companionService = new CompanionService();
