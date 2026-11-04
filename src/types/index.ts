export type VerificationStatus = 'verified' | 'pending' | 'ai-suggested';

export interface Person {
  id: string;
  name: string;
  relationship: string; // e.g. "Wife", "Daughter", "Grandson", "Lifelong Friend"
  bio: string;
  birthYear?: number;
  avatarUrl: string;
  isMainPatient?: boolean;
  confirmedByFamily: boolean;
  sharedMemoryCount: number;
}

export interface MemoryMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption: string;
  date?: string;
}

export interface Memory {
  id: string;
  title: string;
  year: number;
  dateStr: string; // e.g. "April 13, 1998"
  location: string;
  albumId: string;
  peopleIds: string[];
  media: MemoryMedia[];
  story: string;
  audioDescription?: string;
  status: VerificationStatus;
  source: 'family_submitted' | 'caregiver' | 'ai_drafted';
  approvedBy?: string;
  era: 'Childhood' | 'First School' | 'College' | 'Career' | 'Wedding & Family' | 'Golden Years';
  tags: string[];
  songId?: string;
  mapCoordinates?: { x: number; y: number; label: string }; // For illustrated map
}

export interface Album {
  id: string;
  title: string;
  coverUrl: string;
  colorTheme: string; // e.g., 'blue', 'gold', 'coral', 'amber', 'sage'
  yearRange: string;
  description: string;
  memoryCount: number;
}

export interface RoutineItem {
  id: string;
  title: string;
  time: string; // "10:00 AM"
  period: 'Morning' | 'Afternoon' | 'Evening';
  category: 'activity' | 'meal' | 'medication' | 'family_call' | 'walk';
  notes: string;
  completed: boolean;
  reminderStatus: 'Active' | 'Dismissed';
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  era: string;
  coverGradient: string;
  duration: string;
  relatedMemoryId?: string;
  note: string;
}

export interface DiaryEntry {
  id: string;
  dateStr: string;
  weather: string;
  greeting: string;
  morningNote: string;
  afternoonNote: string;
  eveningNote: string;
  caregiverSign: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  timestamp: string;
  memoryCard?: Memory;
  suggestedPrompts?: string[];
  isAudioPlaying?: boolean;
}

export interface ActivityCard {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'puzzle' | 'coloring' | 'matching' | 'music_story';
  icon: string;
  badge: string;
}
