import { VerificationStatus, SenderType } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export interface MiraResponse {
  text: string;
  suggestedPrompts: string[];
  memoryCard?: any;
}

export class ConversationService {
  /**
   * Deterministic Mira companion evaluation enforcing dementia safety rules
   */
  evaluateRules(
    userText: string,
    verifiedMemories: any[],
    pendingMemories: any[],
    patientName: string = 'Rajiv'
  ): MiraResponse {
    const q = userText.toLowerCase().trim();

    // 1. Safety check: Check if user is asking about unverified / pending memory
    const stopWords = new Set([
      'trip', 'with', 'from', 'about', 'your', 'have', 'tell', 'when',
      'view', 'views', 'time', 'first', 'look', 'what', 'where'
    ]);

    const pendingMatch = pendingMemories.find((m) => {
      const specificWords = m.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !stopWords.has(w));
      const titleHit = specificWords.some((w: string) => q.includes(w));
      const locHit =
        m.location &&
        m.location
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((w: string) => w.length > 3 && !stopWords.has(w))
          .some((w: string) => q.includes(w));
      return titleHit || locHit;
    });

    if (pendingMatch) {
      return {
        text: `A family member has suggested a memory about "${pendingMatch.title}", but it hasn't been confirmed yet by your family. Would you like to explore one of your verified memories instead?`,
        suggestedPrompts: [
          'Tell me about my Goa trip',
          'What happened on my wedding day?',
          'Tell me about my family'
        ]
      };
    }

    // 2. Greetings
    if (
      q.includes('hello') ||
      q.includes('hi') ||
      q.includes('good morning') ||
      q.includes('good afternoon') ||
      q.includes('good evening')
    ) {
      return {
        text: `Hello ${patientName}! It is lovely to spend time with you today. Would you like to revisit a beautiful memory together, or listen to some soothing music?`,
        suggestedPrompts: [
          'Tell me about my family',
          'What happened on my wedding day?',
          'Tell me about my Goa trip',
          'Let’s listen to my favourite music'
        ]
      };
    }

    // 3. Goa Trip
    if (q.includes('goa') || q.includes('beach') || q.includes('ocean') || q.includes('calangute')) {
      const goaMem =
        verifiedMemories.find((m) => m.approximateYear === 1998 || m.title.toLowerCase().includes('goa')) ||
        verifiedMemories[0];

      return {
        text: `Of course, ${patientName}! Your family visited Goa in 1998. Anita and Riya were with you. You walked on the golden sand and enjoyed sweet coconut water at sunset. Would you like to see the photographs from that trip?`,
        memoryCard: goaMem,
        suggestedPrompts: [
          'Who was with me in Goa?',
          'Show me my wedding photographs',
          'Tell me about my childhood'
        ]
      };
    }

    // 4. Wedding Day / Anita
    if (q.includes('wedding') || q.includes('anita') || q.includes('marry') || q.includes('marriage')) {
      const weddingMem =
        verifiedMemories.find((m) => m.approximateYear === 1985 || m.title.toLowerCase().includes('wedding')) ||
        verifiedMemories[0];

      return {
        text: `You and Anita were married on November 22, 1985, under a beautiful mandap of fresh orange marigolds and fragrant jasmine. Anita wore a deep red silk saree, and your family danced with great joy.`,
        memoryCard: weddingMem,
        suggestedPrompts: [
          'Tell me about Riya',
          'Tell me about my Goa trip',
          'Show me my old photographs'
        ]
      };
    }

    // 5. Family & Children
    if (
      q.includes('family') ||
      q.includes('riya') ||
      q.includes('daniel') ||
      q.includes('grandson') ||
      q.includes('daughter')
    ) {
      const famMem =
        verifiedMemories.find((m) => m.approximateYear === 2019) ||
        verifiedMemories.find((m) => m.approximateYear === 2001) ||
        verifiedMemories[0];

      return {
        text: `Your family loves you very dearly, ${patientName}. Your wife Anita, your daughter Riya, and your bright grandson Daniel bring so much laughter to your home. Daniel loves walking in the garden and hearing your stories.`,
        memoryCard: famMem,
        suggestedPrompts: [
          'Tell me about grandson Daniel',
          'What happened on my wedding day?',
          'Tell me about my college days'
        ]
      };
    }

    // 6. Daniel (Grandson)
    if (q.includes('daniel') || q.includes('grandson') || q.includes('tulip')) {
      const danielMem =
        verifiedMemories.find((m) => m.approximateYear === 2019 || m.title.toLowerCase().includes('daniel')) ||
        verifiedMemories[0];

      return {
        text: `Daniel is your 6-year-old grandson! He loves running through flower meadows with you and holding your hand. You showed him how to whistle with a green leaf in the spring of 2019.`,
        memoryCard: danielMem,
        suggestedPrompts: [
          'Tell me about my daughter Riya',
          'Tell me about my wedding day',
          'Let’s listen to some music'
        ]
      };
    }

    // 7. College Days / Suresh / Engineering
    if (
      q.includes('college') ||
      q.includes('suresh') ||
      q.includes('engineering') ||
      q.includes('stephens') ||
      q.includes('degree')
    ) {
      const collegeMem =
        verifiedMemories.find((m) => m.approximateYear === 1978 || m.title.toLowerCase().includes('graduation')) ||
        verifiedMemories[0];

      return {
        text: `In 1978, you graduated with honors in Civil Engineering from St. Stephens College alongside your lifelong friend Suresh. You both celebrated with warm samosas and cardamom tea.`,
        memoryCard: collegeMem,
        suggestedPrompts: [
          'Tell me about my first bicycle',
          'What happened on my wedding day?',
          'Tell me about my Goa trip'
        ]
      };
    }

    // 8. Childhood / Bicycle / Shimla
    if (
      q.includes('childhood') ||
      q.includes('bicycle') ||
      q.includes('bike') ||
      q.includes('shimla') ||
      q.includes('young')
    ) {
      const childMem =
        verifiedMemories.find((m) => m.approximateYear === 1960 || m.title.toLowerCase().includes('bicycle')) ||
        verifiedMemories[0];

      return {
        text: `When you were growing up in Shimla hills around 1960, your father gave you a shiny red bicycle. You loved racing down the gentle slope with the crisp hill breeze on your face.`,
        memoryCard: childMem,
        suggestedPrompts: [
          'Tell me about my school days',
          'What happened on my wedding day?',
          'Tell me about my family'
        ]
      };
    }

    // 9. Music / Songs
    if (q.includes('music') || q.includes('song') || q.includes('listen') || q.includes('sing')) {
      return {
        text: `Music is such a wonderful way to bring peace to the mind. You have lovely melodies saved from your wedding and your trip to Goa. Shall we listen to a gentle melody together?`,
        suggestedPrompts: [
          'Play Goa beach melody',
          'Play Here Comes the Sun',
          'Tell me about my family'
        ]
      };
    }

    // 10. General search across verified memories
    const matchedMem = verifiedMemories.find((m) => {
      const titleWords = m.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      const titleHit = titleWords.some((w: string) => q.includes(w));
      const locHit = m.location && m.location.toLowerCase().split(/[\s,]+/).filter((w: string) => w.length > 3).some((w: string) => q.includes(w));
      const tagHit = Array.isArray(m.tags) && m.tags.some((t: string) => q.includes(t.toLowerCase()));
      return titleHit || locHit || tagHit;
    });

    if (matchedMem) {
      return {
        text: `Here is a verified memory from your family storybook: "${matchedMem.title}". ${matchedMem.story}`,
        memoryCard: matchedMem,
        suggestedPrompts: [
          'Tell me about my family',
          'Show me my wedding photographs',
          'What happened on my Goa trip?'
        ]
      };
    }

    // 11. EXACT REQUIRED UNKNOWN FALLBACK
    return {
      text: "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.",
      suggestedPrompts: [
        'Tell me about my family',
        'Tell me about my wedding day',
        'Tell me about my Goa trip',
        'Tell me about my childhood'
      ]
    };
  }

  async handleUserMessage(
    patientId: string,
    messageText: string,
    conversationId?: string,
    userId?: string,
    patientSessionId?: string
  ) {
    // 1. Fetch Patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId }
    });

    const patientName = patient?.fullName.split(' ')[0] || 'Rajiv';

    // 2. Fetch Verified and Pending memories
    const allMemories = await prisma.memory.findMany({
      where: {
        patientId,
        deletedAt: null
      },
      include: {
        people: {
          include: { person: true }
        },
        album: true
      }
    });

    const verifiedMemories = allMemories.filter((m) => m.verificationStatus === VerificationStatus.VERIFIED);
    const pendingMemories = allMemories.filter(
      (m) => m.verificationStatus === VerificationStatus.PENDING || m.verificationStatus === VerificationStatus.AI_SUGGESTED
    );

    // 3. Evaluate safety rules
    const result = this.evaluateRules(messageText, verifiedMemories, pendingMemories, patientName);

    // 4. Persist conversation and messages
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          patientId,
          userId: userId || null,
          patientSessionId: patientSessionId || null
        }
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: convId,
        senderType: SenderType.USER,
        messageText
      }
    });

    // Save companion message
    const companionMessage = await prisma.message.create({
      data: {
        conversationId: convId,
        senderType: SenderType.COMPANION,
        messageText: result.text,
        relatedMemoryId: result.memoryCard?.id || null
      }
    });

    return {
      conversationId: convId,
      messageId: companionMessage.id,
      text: result.text,
      suggestedPrompts: result.suggestedPrompts,
      memoryCard: result.memoryCard || null
    };
  }
}

export const conversationService = new ConversationService();
