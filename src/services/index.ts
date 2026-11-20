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
    _allPeople: Person[],
    patientName: string = 'Rajiv'
  ): AIResponse {
    const q = userText.toLowerCase().trim();
    const verifiedMemories = allMemories.filter(m => m.status === 'verified');
    const pendingMemories = allMemories.filter(m => m.status === 'pending' || m.status === 'ai-suggested');
    const stopWords = new Set([
      'about', 'again', 'could', 'from', 'have', 'memory', 'please', 'show',
      'tell', 'that', 'their', 'there', 'this', 'what', 'when', 'where', 'which',
      'with', 'would', 'your'
    ]);
    const terms = (value: string) => value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term));
    const queryTerms = terms(q);
    const overlap = (value: string, weight: number) => {
      const valueTerms = new Set(terms(value));
      return queryTerms.reduce((score, term) => score + (valueTerms.has(term) ? weight : 0), 0);
    };
    const promptFor = (memory: Memory) => `Tell me about ${memory.title}`;
    const safePrompts = verifiedMemories.slice(0, 4).map(promptFor);

    // 1. Safety check: Check if user is asking about unverified / pending memory
    const pendingMatch = pendingMemories.find(m => {
      const specificWords = terms(m.title);
      const titleHit = specificWords.some(w => q.includes(w));
      const locHit = m.location && terms(m.location).some(w => q.includes(w));
      return titleHit || locHit;
    });

    if (pendingMatch) {
      return {
        text: `A family member has suggested a memory about "${pendingMatch.title}", but it hasn't been confirmed yet by your family. Would you like to explore one of your verified memories instead?`,
        suggestedPrompts: safePrompts
      };
    }

    // 2. Greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('good morning') || q.includes('good afternoon') || q.includes('good evening')) {
      return {
        text: `Hello ${patientName}! It is lovely to spend time with you today. Would you like to revisit a beautiful memory together, or listen to some soothing music?`,
        suggestedPrompts: [...safePrompts.slice(0, 3), 'Let’s listen to my favourite music']
      };
    }

    // 3. Music is an app action, not a claim about a person's past.
    if (q.includes('music') || q.includes('song') || q.includes('listen') || q.includes('sing')) {
      return {
        text: 'We can open your saved music together. Choose a familiar song whenever you are ready.',
        suggestedPrompts: safePrompts.slice(0, 3)
      };
    }

    // 4. Weighted retrieval across family-verified fields only.
    const matchedMem = verifiedMemories
      .map(memory => ({
        memory,
        score:
          overlap(memory.title, 5) +
          overlap(memory.tags.join(' '), 4) +
          overlap(memory.location, 3) +
          overlap(memory.era, 2) +
          overlap(memory.story, 1)
      }))
      .filter(result => result.score >= 3)
      .sort((a, b) => b.score - a.score)[0]?.memory;

    if (matchedMem) {
      return {
        text: `Your family storybook has a verified memory called "${matchedMem.title}". ${matchedMem.story}`,
        memoryCard: matchedMem,
        suggestedPrompts: safePrompts.filter(prompt => prompt !== promptFor(matchedMem)).slice(0, 3)
      };
    }

    // EXACT REQUIRED UNKNOWN FALLBACK
    return {
      text: "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.",
      suggestedPrompts: safePrompts
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
