import { Memory, Person } from '../types';

// ==========================================
// 1. MEMORY SERVICE
// ==========================================
export interface IMemoryService {
  getVerifiedMemories(memories: Memory[]): Memory[];
  searchMemories(memories: Memory[], query: string): Memory[];
  getMemoriesByPerson(memories: Memory[], personId: string): Memory[];
  getMemoriesByEra(memories: Memory[], era: string): Memory[];
  getMemoryById(memories: Memory[], id: string): Memory | undefined;
}

export const memoryService: IMemoryService = {
  getVerifiedMemories(memories: Memory[]): Memory[] {
    return memories.filter(m => m.status === 'verified');
  },

  searchMemories(memories: Memory[], query: string): Memory[] {
    const q = query.toLowerCase().trim();
    if (!q) return memories;
    return memories.filter(m => 
      m.title.toLowerCase().includes(q) ||
      m.story.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      m.year.toString().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    );
  },

  getMemoriesByPerson(memories: Memory[], personId: string): Memory[] {
    return memories.filter(m => m.peopleIds.includes(personId));
  },

  getMemoriesByEra(memories: Memory[], era: string): Memory[] {
    return memories.filter(m => m.era === era);
  },

  getMemoryById(memories: Memory[], id: string): Memory | undefined {
    return memories.find(m => m.id === id);
  }
};

// ==========================================
// 2. STORY SERVICE
// Deterministic templates only, no hallucinated facts
// ==========================================
export interface StoryDraftInput {
  title: string;
  year?: number | string;
  location?: string;
  peopleNames?: string[];
  description?: string;
}

export interface IStoryService {
  generateStoryDraft(input: StoryDraftInput): string;
}

export const storyService: IStoryService = {
  generateStoryDraft(input: StoryDraftInput): string {
    const { title, year, location, peopleNames = [], description = '' } = input;
    
    const parts: string[] = [];

    if (location && year) {
      parts.push(`In ${year}, a memorable time was spent in ${location}.`);
    } else if (year) {
      parts.push(`In ${year}, a special moment took place.`);
    } else if (location) {
      parts.push(`A cherished time spent in ${location}.`);
    }

    if (peopleNames.length > 0) {
      const namesList = peopleNames.length === 1 
        ? peopleNames[0]
        : `${peopleNames.slice(0, -1).join(', ')} and ${peopleNames[peopleNames.length - 1]}`;
      parts.push(`${namesList} shared this warm moment together.`);
    }

    if (description.trim()) {
      parts.push(description.trim());
    }

    if (parts.length === 0) {
      return `A family memory titled "${title}", preserved with love.`;
    }

    return parts.join(' ');
  }
};

// ==========================================
// 3. CONVERSATION SERVICE (Safety Rules Enforced)
// ==========================================
export interface AIResponse {
  text: string;
  memoryCard?: Memory;
  suggestedPrompts: string[];
}

export interface IConversationService {
  respond(
    userText: string,
    allMemories: Memory[],
    allPeople: Person[],
    patientName: string
  ): AIResponse;
}

export const conversationService: IConversationService = {
  respond(
    userText: string,
    allMemories: Memory[],
    allPeople: Person[],
    patientName: string = 'Rajiv'
  ): AIResponse {
    const q = userText.toLowerCase().trim();
    const verifiedMemories = allMemories.filter(m => m.status === 'verified');
    const pendingMemories = allMemories.filter(m => m.status === 'pending' || m.status === 'ai-suggested');

    // 1. Safety check: Check if user is asking about unverified / pending memory
    const stopWords = new Set(['trip', 'with', 'from', 'about', 'your', 'have', 'tell', 'when', 'view', 'views', 'time', 'first', 'look', 'what', 'where']);
    const pendingMatch = pendingMemories.find(m => {
      const specificWords = m.title.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      const titleHit = specificWords.some(w => q.includes(w));
      const locHit = m.location && m.location.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3 && !stopWords.has(w)).some(w => q.includes(w));
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
    if (q.includes('hello') || q.includes('hi') || q.includes('good morning') || q.includes('good afternoon') || q.includes('good evening')) {
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
      const goaMem = verifiedMemories.find(m => m.id === 'mem-1998');
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
      const weddingMem = verifiedMemories.find(m => m.id === 'mem-1985');
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
    if (q.includes('family') || q.includes('riya') || q.includes('daniel') || q.includes('grandson') || q.includes('daughter')) {
      const famMem = verifiedMemories.find(m => m.id === 'mem-2019') || verifiedMemories.find(m => m.id === 'mem-2001');
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
      const danielMem = verifiedMemories.find(m => m.id === 'mem-2019');
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
    if (q.includes('college') || q.includes('suresh') || q.includes('engineering') || q.includes('stephens') || q.includes('degree')) {
      const collegeMem = verifiedMemories.find(m => m.id === 'mem-1978');
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
    if (q.includes('childhood') || q.includes('bicycle') || q.includes('bike') || q.includes('shimla') || q.includes('young')) {
      const childMem = verifiedMemories.find(m => m.id === 'mem-1960');
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
    const matchedMem = verifiedMemories.find(m => 
      m.title.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)) ||
      m.location.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)) ||
      m.tags.some(t => q.includes(t.toLowerCase()))
    );

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

    // EXACT REQUIRED UNKNOWN FALLBACK
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
};

// ==========================================
// 4. SPEECH SERVICE (Text to Speech)
// Gentle, calming playback with honest browser integration
// ==========================================
export interface ISpeechService {
  isSupported(): boolean;
  speak(text: string, onEnd?: () => void): void;
  stop(): void;
}

export const speechService: ISpeechService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  speak(text: string, onEnd?: () => void): void {
    if (!this.isSupported()) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // Comfortably slow and calm for seniors
    utterance.pitch = 1.0;
    
    // Attempt to pick a gentle natural voice
    const voices = window.speechSynthesis.getVoices();
    const gentleVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    );
    if (gentleVoice) utterance.voice = gentleVoice;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  },

  stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
};

// ==========================================
// 5. VOICE SERVICE (Speech to Text)
// Gracefully degrades if unavailable
// ==========================================
export interface IVoiceService {
  isSupported(): boolean;
  startListening(onResult: (text: string) => void, onError: (err: string) => void): void;
  stopListening(): void;
}

let activeRecognition: any = null;

export const voiceService: IVoiceService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && (
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    );
  },

  startListening(onResult: (text: string) => void, onError: (err: string) => void): void {
    if (!this.isSupported()) {
      onError('Voice recognition is not supported in this browser. Please use the text input below.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      activeRecognition = new SpeechRecognition();
      activeRecognition.continuous = false;
      activeRecognition.interimResults = false;
      activeRecognition.lang = 'en-US';

      activeRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      activeRecognition.onerror = (event: any) => {
        onError(event.error || 'Could not hear voice. You can type your question.');
      };

      activeRecognition.start();
    } catch (e: any) {
      onError('Microphone unavailable. You can easily type your thoughts.');
    }
  },

  stopListening(): void {
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {
        // ignore
      }
      activeRecognition = null;
    }
  }
};

// ==========================================
// 6. MEDIA SERVICE
// Local file to preview dataUrl
// ==========================================
export interface IMediaService {
  readFileAsDataUrl(file: File): Promise<string>;
}

export const mediaService: IMediaService = {
  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read photo file'));
      reader.readAsDataURL(file);
    });
  }
};
