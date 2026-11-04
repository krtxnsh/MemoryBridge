import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Person, Memory, Album, RoutineItem, Song, DiaryEntry } from '../types';
import {
  INITIAL_PEOPLE,
  INITIAL_MEMORIES,
  INITIAL_ALBUMS,
  INITIAL_ROUTINE,
  INITIAL_SONGS,
  INITIAL_DIARY
} from '../data/mockData';

const STORAGE_KEY = 'memorybridge_store_v1';

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'amber';
}

interface AppContextType {
  people: Person[];
  memories: Memory[];
  albums: Album[];
  routine: RoutineItem[];
  songs: Song[];
  diary: DiaryEntry;
  patientName: string;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Audio state
  activeSong: Song | null;
  isPlayingMusic: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;

  // Actions
  addMemory: (mem: Omit<Memory, 'id'>) => string;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  approveMemory: (id: string, approverName?: string) => void;
  rejectMemory: (id: string) => void;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  addRoutineItem: (item: Omit<RoutineItem, 'id'>) => void;
  toggleRoutineCompleted: (id: string) => void;
  deleteRoutineItem: (id: string) => void;
  updateDiary: (updates: Partial<DiaryEntry>) => void;
  resetDemoData: () => void;

  // Feedback toast
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'info' | 'amber') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load persisted state or fallback to defaults
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_people`);
      return saved ? JSON.parse(saved) : INITIAL_PEOPLE;
    } catch {
      return INITIAL_PEOPLE;
    }
  });

  const [memories, setMemories] = useState<Memory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_memories`);
      return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  });

  const [albums, setAlbums] = useState<Album[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_albums`);
      return saved ? JSON.parse(saved) : INITIAL_ALBUMS;
    } catch {
      return INITIAL_ALBUMS;
    }
  });

  const [routine, setRoutine] = useState<RoutineItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_routine`);
      return saved ? JSON.parse(saved) : INITIAL_ROUTINE;
    } catch {
      return INITIAL_ROUTINE;
    }
  });

  const [songs] = useState<Song[]>(INITIAL_SONGS);

  const [diary, setDiary] = useState<DiaryEntry>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_diary`);
      return saved ? JSON.parse(saved) : INITIAL_DIARY;
    } catch {
      return INITIAL_DIARY;
    }
  });

  const [patientName] = useState<string>('Rajiv');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Active music
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_people`, JSON.stringify(people));
      localStorage.setItem(`${STORAGE_KEY}_memories`, JSON.stringify(memories));
      localStorage.setItem(`${STORAGE_KEY}_albums`, JSON.stringify(albums));
      localStorage.setItem(`${STORAGE_KEY}_routine`, JSON.stringify(routine));
      localStorage.setItem(`${STORAGE_KEY}_diary`, JSON.stringify(diary));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [people, memories, albums, routine, diary]);

  const showToast = (message: string, type: 'success' | 'info' | 'amber' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  };

  const playSong = (song: Song) => {
    setActiveSong(song);
    setIsPlayingMusic(true);
    showToast(`Playing "${song.title}"`, 'info');
  };

  const pauseSong = () => {
    setIsPlayingMusic(false);
  };

  const addMemory = (mem: Omit<Memory, 'id'>): string => {
    const newId = `mem-${Date.now()}`;
    const newMemory: Memory = { ...mem, id: newId };
    setMemories(prev => [newMemory, ...prev]);

    // Update album count
    setAlbums(prev => prev.map(a => a.id === mem.albumId ? { ...a, memoryCount: a.memoryCount + 1 } : a));

    showToast(`Memory "${mem.title}" saved successfully!`, 'success');
    return newId;
  };

  const updateMemory = (id: string, updates: Partial<Memory>) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    showToast('Memory updated.', 'info');
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    showToast('Memory removed.', 'amber');
  };

  const approveMemory = (id: string, approverName: string = 'Anita') => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, status: 'verified', approvedBy: approverName } : m));
    showToast('Memory verified! It is now accessible to the patient and AI companion.', 'success');
  };

  const rejectMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    showToast('Draft memory declined.', 'info');
  };

  const addPerson = (person: Omit<Person, 'id'>) => {
    const newPerson: Person = { ...person, id: `p-${Date.now()}` };
    setPeople(prev => [...prev, newPerson]);
    showToast(`${person.name} added to family circle.`, 'success');
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    showToast('Family profile updated.', 'info');
  };

  const addRoutineItem = (item: Omit<RoutineItem, 'id'>) => {
    const newItem: RoutineItem = { ...item, id: `rout-${Date.now()}` };
    setRoutine(prev => [...prev, newItem]);
    showToast('Routine reminder added.', 'success');
  };

  const toggleRoutineCompleted = (id: string) => {
    setRoutine(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteRoutineItem = (id: string) => {
    setRoutine(prev => prev.filter(r => r.id !== id));
    showToast('Routine item removed.', 'info');
  };

  const updateDiary = (updates: Partial<DiaryEntry>) => {
    setDiary(prev => ({ ...prev, ...updates }));
    showToast('Diary entry updated.', 'success');
  };

  const resetDemoData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_people`);
    localStorage.removeItem(`${STORAGE_KEY}_memories`);
    localStorage.removeItem(`${STORAGE_KEY}_albums`);
    localStorage.removeItem(`${STORAGE_KEY}_routine`);
    localStorage.removeItem(`${STORAGE_KEY}_diary`);
    setPeople(INITIAL_PEOPLE);
    setMemories(INITIAL_MEMORIES);
    setAlbums(INITIAL_ALBUMS);
    setRoutine(INITIAL_ROUTINE);
    setDiary(INITIAL_DIARY);
    showToast('Demo data reset to original memories.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        people,
        memories,
        albums,
        routine,
        songs,
        diary,
        patientName,
        textSize,
        setTextSize,
        voiceEnabled,
        setVoiceEnabled,
        activeSong,
        isPlayingMusic,
        playSong,
        pauseSong,
        addMemory,
        updateMemory,
        deleteMemory,
        approveMemory,
        rejectMemory,
        addPerson,
        updatePerson,
        addRoutineItem,
        toggleRoutineCompleted,
        deleteRoutineItem,
        updateDiary,
        resetDemoData,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
