import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Person, Memory, Album, RoutineItem, Song, DiaryEntry } from '../types';
import {
  INITIAL_PEOPLE,
  INITIAL_MEMORIES,
  INITIAL_ALBUMS,
  INITIAL_ROUTINE,
  INITIAL_SONGS,
  INITIAL_DIARY
} from '../data/mockData';
import {
  authApi,
  patientApi,
  memoryApi,
  personApi,
  albumApi,
  routineApi,
  diaryApi,
  getAccessToken,
  getActivePatientId,
  setActivePatientId,
  clearAllTokens
} from '../api/client';

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'amber';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'CAREGIVER' | 'FAMILY_MEMBER' | 'ADMIN';
}

export interface PatientProfileData {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  profileImage?: string | null;
  relationship?: string;
  accessRole?: string;
  isDemo?: boolean;
}

interface AppContextType {
  // Auth state
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  startDemo: (role?: 'caregiver' | 'family') => Promise<void>;
  logout: () => Promise<void>;

  // Patient context
  activePatientId: string;
  activePatient: PatientProfileData | null;
  patientsList: PatientProfileData[];
  selectPatient: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Domain data
  people: Person[];
  memories: Memory[];
  albums: Album[];
  routine: RoutineItem[];
  songs: Song[];
  diary: DiaryEntry;
  patientName: string;

  // Preferences & Accessibility
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  
  // Audio state
  activeSong: Song | null;
  isPlayingMusic: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;

  // Domain Actions
  addMemory: (mem: Omit<Memory, 'id'>) => Promise<string>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  approveMemory: (id: string, approverName?: string) => Promise<void>;
  rejectMemory: (id: string) => Promise<void>;
  addPerson: (person: Omit<Person, 'id'>) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  addRoutineItem: (item: Omit<RoutineItem, 'id'>) => Promise<void>;
  toggleRoutineCompleted: (id: string) => Promise<void>;
  deleteRoutineItem: (id: string) => Promise<void>;
  updateDiary: (updates: Partial<DiaryEntry>) => Promise<void>;
  resetDemoData: () => Promise<void>;

  // Feedback toast
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'info' | 'amber') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth & Patient state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePatientId, setActivePatientIdState] = useState<string>(() => getActivePatientId() || '');
  const [activePatient, setActivePatient] = useState<PatientProfileData | null>(null);
  const [patientsList, setPatientsList] = useState<PatientProfileData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Domain data state
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [routine, setRoutine] = useState<RoutineItem[]>(INITIAL_ROUTINE);
  const [songs] = useState<Song[]>(INITIAL_SONGS);
  const [diary, setDiary] = useState<DiaryEntry>(INITIAL_DIARY);

  // Patient name derived from profile
  const patientName = activePatient?.fullName?.split(' ')[0] || 'Rajiv';

  // Accessibility & audio preferences
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'amber' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAllTokens();
      setCurrentUser(null);
      setPatientsList([]);
      setActivePatient(null);
      setActivePatientIdState('');
      showToast('Your session expired. Please sign in again.', 'amber');
    };
    window.addEventListener('memorybridge:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('memorybridge:auth-expired', handleAuthExpired);
  }, [showToast]);

  // Fetch all domain data for the active patient
  const loadPatientDomainData = useCallback(async (patId: string) => {
    if (!patId) return;
    try {
      setIsLoading(true);
      const [memoriesRes, peopleRes, albumsRes, routineRes, diaryRes] = await Promise.all([
        memoryApi.listMemories(patId).catch(() => ({ items: INITIAL_MEMORIES, total: INITIAL_MEMORIES.length })),
        personApi.listPeople(patId).catch(() => INITIAL_PEOPLE),
        albumApi.listAlbums(patId).catch(() => INITIAL_ALBUMS),
        routineApi.listRoutine(patId).catch(() => INITIAL_ROUTINE),
        diaryApi.getDiary(patId).catch(() => INITIAL_DIARY)
      ]);

      if (memoriesRes.items && memoriesRes.items.length > 0) setMemories(memoriesRes.items);
      if (peopleRes && peopleRes.length > 0) setPeople(peopleRes);
      if (albumsRes && albumsRes.length > 0) setAlbums(albumsRes);
      if (routineRes && routineRes.length > 0) setRoutine(routineRes);
      if (diaryRes) setDiary(diaryRes);
    } catch (err: any) {
      console.warn('Failed to load patient domain data, keeping fallback', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bootstrap initial session & data
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsLoading(true);

        // 1. Check if user access token is already stored
        const token = getAccessToken();
        if (!token) return;

        let user: UserProfile;
        try {
          user = await authApi.me();
          if (isMounted) setCurrentUser(user);
        } catch {
          clearAllTokens();
          return;
        }

        // 3. Fetch patients accessible to user
        let patients: any[] = [];
        try {
          patients = await patientApi.listPatients();
          if (isMounted) setPatientsList(patients);
        } catch (e) {
          console.warn('Could not list patients', e);
        }

        // 4. Select active patient (Rajiv Sharma demo or first in list)
        const storedPatientId = getActivePatientId();
        const selected = patients.find(p => p.id === storedPatientId) || patients[0];
        if (selected) {
          if (isMounted) {
            setActivePatientIdState(selected.id);
            setActivePatientId(selected.id);
            setActivePatient(selected);
          }

          // Ensure tablet session is provisioned for seamless patient tablet mode
          try {
            await patientApi.createTabletSession(selected.id, 'Tablet Demo');
          } catch {
            // Tablet session issuance optional if already active
          }

          // Load domain data
          await loadPatientDomainData(selected.id);
        }
      } catch (err) {
        console.warn('Bootstrap error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadPatientDomainData]);

  // Auth Actions
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password: pass });
      setCurrentUser(res.user);

      const patients = await patientApi.listPatients();
      setPatientsList(patients);
      const targetPatient = patients[0];
      if (targetPatient) {
        setActivePatientIdState(targetPatient.id);
        setActivePatientId(targetPatient.id);
        setActivePatient(targetPatient);
        await loadPatientDomainData(targetPatient.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, role?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ email, password: pass, name, role });
      setCurrentUser(res.user);
      const patients = await patientApi.listPatients();
      setPatientsList(patients);
    } finally {
      setIsLoading(false);
    }
  };

  const startDemo = async (role: 'caregiver' | 'family' = 'caregiver') => {
    setIsLoading(true);
    try {
      const res = await authApi.demo(role);
      setCurrentUser(res.user);

      const patients = await patientApi.listPatients();
      setPatientsList(patients);
      const targetPatient = patients[0];
      if (targetPatient) {
        setActivePatientIdState(targetPatient.id);
        setActivePatientId(targetPatient.id);
        setActivePatient(targetPatient);
        await loadPatientDomainData(targetPatient.id);
      }
      showToast(`Demo started as ${role === 'family' ? 'Riya' : 'Anita'}.`, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAllTokens();
      setCurrentUser(null);
      setPatientsList([]);
      setActivePatient(null);
      setActivePatientIdState('');
      setMemories(INITIAL_MEMORIES);
      setPeople(INITIAL_PEOPLE);
      setAlbums(INITIAL_ALBUMS);
      setRoutine(INITIAL_ROUTINE);
      setDiary(INITIAL_DIARY);
      showToast('Signed out successfully.', 'info');
    }
  };

  const selectPatient = async (id: string) => {
    const p = patientsList.find(item => item.id === id);
    if (p) {
      setActivePatientIdState(id);
      setActivePatientId(id);
      setActivePatient(p);
      await loadPatientDomainData(id);
      showToast(`Active patient switched to ${p.fullName}`, 'info');
    }
  };

  const refreshData = async () => {
    const patients = await patientApi.listPatients();
    setPatientsList(patients);
    const target = patients.find(patient => patient.id === activePatientId) || patients[0];
    if (target) {
      setActivePatientIdState(target.id);
      setActivePatientId(target.id);
      setActivePatient(target);
      await loadPatientDomainData(target.id);
    }
  };

  // Music Player Actions
  const playSong = (song: Song) => {
    setActiveSong(song);
    setIsPlayingMusic(true);
    showToast(`Playing "${song.title}"`, 'info');
  };

  const pauseSong = () => {
    setIsPlayingMusic(false);
  };

  // Memory Actions (Optimistic UI + API synchronization)
  const addMemory = async (mem: Omit<Memory, 'id'>): Promise<string> => {
    const tempId = `mem-${Date.now()}`;
    const newMemory: Memory = { ...mem, id: tempId };
    setMemories(prev => [newMemory, ...prev]);

    setAlbums(prev =>
      prev.map(a => (a.id === mem.albumId ? { ...a, memoryCount: a.memoryCount + 1 } : a))
    );

    if (activePatientId) {
      try {
        const created = await memoryApi.createMemory(activePatientId, mem);
        setMemories(prev => prev.map(m => (m.id === tempId ? created : m)));
        showToast(`Memory "${mem.title}" saved successfully!`, 'success');
        return created.id;
      } catch (err: any) {
        showToast(`Saved locally (offline mode): ${err.message}`, 'amber');
      }
    }

    showToast(`Memory "${mem.title}" saved successfully!`, 'success');
    return tempId;
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
    showToast('Memory updated.', 'info');

    try {
      await memoryApi.updateMemory(id, updates);
    } catch (err: any) {
      console.warn('Backend updateMemory failed, keeping optimistic state', err);
    }
  };

  const deleteMemory = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    showToast('Memory removed.', 'amber');

    try {
      await memoryApi.deleteMemory(id);
    } catch (err: any) {
      console.warn('Backend deleteMemory failed', err);
    }
  };

  const approveMemory = async (id: string, approverName: string = 'Anita (Caregiver)') => {
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'verified', approvedBy: approverName } : m))
    );
    showToast('Memory verified! It is now accessible to the patient and AI companion.', 'success');

    try {
      await memoryApi.verifyMemory(id, `Approved by ${approverName}`);
    } catch (err: any) {
      console.warn('Backend verifyMemory failed', err);
    }
  };

  const rejectMemory = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    showToast('Draft memory declined.', 'info');

    try {
      await memoryApi.rejectMemory(id);
    } catch (err: any) {
      console.warn('Backend rejectMemory failed', err);
    }
  };

  // Person Actions
  const addPerson = async (person: Omit<Person, 'id'>) => {
    const tempId = `p-${Date.now()}`;
    const newPerson: Person = { ...person, id: tempId };
    setPeople(prev => [...prev, newPerson]);
    showToast(`${person.name} added to family circle.`, 'success');

    if (activePatientId) {
      try {
        const created = await personApi.createPerson(activePatientId, person);
        setPeople(prev => prev.map(p => (p.id === tempId ? created : p)));
      } catch (err: any) {
        console.warn('Backend createPerson failed', err);
      }
    }
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    setPeople(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Family profile updated.', 'info');

    try {
      await personApi.updatePerson(id, updates);
    } catch (err: any) {
      console.warn('Backend updatePerson failed', err);
    }
  };

  // Routine Actions
  const addRoutineItem = async (item: Omit<RoutineItem, 'id'>) => {
    const tempId = `rout-${Date.now()}`;
    const newItem: RoutineItem = { ...item, id: tempId };
    setRoutine(prev => [...prev, newItem]);
    showToast('Routine reminder added.', 'success');

    if (activePatientId) {
      try {
        const created = await routineApi.createRoutineItem(activePatientId, item);
        setRoutine(prev => prev.map(r => (r.id === tempId ? created : r)));
      } catch (err: any) {
        console.warn('Backend createRoutineItem failed', err);
      }
    }
  };

  const toggleRoutineCompleted = async (id: string) => {
    const item = routine.find(r => r.id === id);
    const newCompleted = !item?.completed;
    setRoutine(prev => prev.map(r => (r.id === id ? { ...r, completed: newCompleted } : r)));

    try {
      await routineApi.toggleRoutineCompleted(id, newCompleted);
    } catch (err: any) {
      console.warn('Backend toggleRoutineCompleted failed', err);
    }
  };

  const deleteRoutineItem = async (id: string) => {
    setRoutine(prev => prev.filter(r => r.id !== id));
    showToast('Routine item removed.', 'info');

    try {
      await routineApi.deleteRoutineItem(id);
    } catch (err: any) {
      console.warn('Backend deleteRoutineItem failed', err);
    }
  };

  // Diary Actions
  const updateDiary = async (updates: Partial<DiaryEntry>) => {
    setDiary(prev => ({ ...prev, ...updates }));
    showToast('Diary entry updated.', 'success');

    if (activePatientId) {
      try {
        await diaryApi.saveDiary(activePatientId, updates);
      } catch (err: any) {
        console.warn('Backend saveDiary failed', err);
      }
    }
  };

  // Reset Demo Data
  const resetDemoData = async () => {
    if (activePatientId) {
      try {
        await patientApi.resetDemoData(activePatientId);
        await loadPatientDomainData(activePatientId);
        showToast('Demo data reset to fresh original memories in database.', 'info');
        return;
      } catch (err: any) {
        console.warn('Backend resetDemoData failed, falling back to local reset', err);
      }
    }

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
        // Auth
        currentUser,
        isLoggedIn: !!currentUser,
        login,
        register,
        startDemo,
        logout,

        // Patient
        activePatientId,
        activePatient,
        patientsList,
        selectPatient,
        isLoading,
        refreshData,

        // Domain
        people,
        memories,
        albums,
        routine,
        songs,
        diary,
        patientName,

        // Preferences
        textSize,
        setTextSize,
        voiceEnabled,
        setVoiceEnabled,

        // Audio
        activeSong,
        isPlayingMusic,
        playSong,
        pauseSong,

        // Actions
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

        // Feedback
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
