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
  dataLoadError: boolean;
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
  const [dataLoadError, setDataLoadError] = useState<boolean>(false);

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

  // Fetch all domain data for the active patient.
  //
  // The backend is the single source of truth for a signed-in patient workspace.
  // We never silently substitute demo/mock data for a failed request, and we
  // never hide a real (possibly empty) result behind seed content — doing so
  // would mask backend failures and show memories that are not actually there.
  const loadPatientDomainData = useCallback(async (patId: string) => {
    if (!patId) return;
    setIsLoading(true);
    setDataLoadError(false);

    const [memoriesRes, peopleRes, albumsRes, routineRes, diaryRes] = await Promise.allSettled([
      memoryApi.listMemories(patId),
      personApi.listPeople(patId),
      albumApi.listAlbums(patId),
      routineApi.listRoutine(patId),
      diaryApi.getDiary(patId)
    ]);

    let anyFailed = false;

    if (memoriesRes.status === 'fulfilled') setMemories(memoriesRes.value.items);
    else anyFailed = true;

    if (peopleRes.status === 'fulfilled') setPeople(peopleRes.value);
    else anyFailed = true;

    if (albumsRes.status === 'fulfilled') setAlbums(albumsRes.value);
    else anyFailed = true;

    if (routineRes.status === 'fulfilled') setRoutine(routineRes.value);
    else anyFailed = true;

    if (diaryRes.status === 'fulfilled') setDiary(diaryRes.value);
    else anyFailed = true;

    if (anyFailed) {
      setDataLoadError(true);
      showToast('Some data could not be loaded from the server. Please check your connection.', 'amber');
    }

    setIsLoading(false);
  }, [showToast]);

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

  // -------------------------------------------------------------------
  // Memory Actions — optimistic UI with rollback.
  //
  // Rule: a success message is shown only when the backend confirms the write.
  // When the backend write fails, the optimistic change is rolled back and an
  // error is surfaced. When there is no active patient workspace, the app is in
  // a local-only demo and toasts are labelled accordingly (never "saved").
  // -------------------------------------------------------------------
  const addMemory = async (mem: Omit<Memory, 'id'>): Promise<string> => {
    const tempId = `mem-${Date.now()}`;
    // A new memory ALWAYS starts as pending — only an explicit verification
    // (backend) can mark it verified. Never optimistically mark it verified.
    const newMemory: Memory = { ...mem, id: tempId, status: 'pending', approvedBy: undefined };
    setMemories(prev => [newMemory, ...prev]);
    setAlbums(prev =>
      prev.map(a => (a.id === mem.albumId ? { ...a, memoryCount: a.memoryCount + 1 } : a))
    );

    if (!activePatientId) {
      showToast(`Memory "${mem.title}" added (demo — not saved to a server).`, 'amber');
      return tempId;
    }

    try {
      const created = await memoryApi.createMemory(activePatientId, mem);
      setMemories(prev => prev.map(m => (m.id === tempId ? created : m)));
      showToast(`Memory "${mem.title}" saved. It is pending caregiver verification.`, 'success');
      return created.id;
    } catch (err: any) {
      // Roll back the optimistic insert and album count.
      setMemories(prev => prev.filter(m => m.id !== tempId));
      setAlbums(prev =>
        prev.map(a => (a.id === mem.albumId ? { ...a, memoryCount: Math.max(0, a.memoryCount - 1) } : a))
      );
      showToast(`Could not save memory: ${err.message}`, 'amber');
      throw err;
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    const previous = memories.find(m => m.id === id);
    setMemories(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));

    if (!activePatientId || id.startsWith('mem-')) {
      showToast('Memory updated (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      const saved = await memoryApi.updateMemory(id, updates);
      setMemories(prev => prev.map(m => (m.id === id ? saved : m)));
      showToast('Memory updated.', 'success');
    } catch (err: any) {
      if (previous) setMemories(prev => prev.map(m => (m.id === id ? previous : m)));
      showToast(`Could not update memory: ${err.message}`, 'amber');
      throw err;
    }
  };

  const deleteMemory = async (id: string) => {
    const previous = memories;
    setMemories(prev => prev.filter(m => m.id !== id));

    if (!activePatientId || id.startsWith('mem-')) {
      showToast('Memory removed (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      await memoryApi.deleteMemory(id);
      showToast('Memory removed.', 'info');
    } catch (err: any) {
      setMemories(previous); // rollback
      showToast(`Could not remove memory: ${err.message}`, 'amber');
      throw err;
    }
  };

  const approveMemory = async (id: string, approverName: string = 'Anita (Caregiver)') => {
    const previous = memories.find(m => m.id === id);
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, status: 'verified', approvedBy: approverName } : m))
    );

    if (!activePatientId || id.startsWith('mem-')) {
      showToast('Memory verified (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      const verified = await memoryApi.verifyMemory(id, `Approved by ${approverName}`);
      setMemories(prev => prev.map(m => (m.id === id ? verified : m)));
      showToast('Memory verified! It is now accessible to the patient and AI companion.', 'success');
    } catch (err: any) {
      // CRITICAL: never leave a memory shown as verified when the backend did
      // not verify it. Roll back to the real prior status.
      if (previous) setMemories(prev => prev.map(m => (m.id === id ? previous : m)));
      showToast(`Could not verify memory: ${err.message}. It remains unverified.`, 'amber');
      throw err;
    }
  };

  const rejectMemory = async (id: string) => {
    const previous = memories;
    setMemories(prev => prev.filter(m => m.id !== id));

    if (!activePatientId || id.startsWith('mem-')) {
      showToast('Draft memory declined (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      await memoryApi.rejectMemory(id);
      showToast('Draft memory declined.', 'info');
    } catch (err: any) {
      setMemories(previous); // rollback
      showToast(`Could not decline memory: ${err.message}`, 'amber');
      throw err;
    }
  };

  // Person Actions
  const addPerson = async (person: Omit<Person, 'id'>) => {
    const tempId = `p-${Date.now()}`;
    const newPerson: Person = { ...person, id: tempId };
    setPeople(prev => [...prev, newPerson]);

    if (!activePatientId) {
      showToast(`${person.name} added (demo — not saved to a server).`, 'amber');
      return;
    }

    try {
      const created = await personApi.createPerson(activePatientId, person);
      setPeople(prev => prev.map(p => (p.id === tempId ? created : p)));
      showToast(`${person.name} added to family circle.`, 'success');
    } catch (err: any) {
      setPeople(prev => prev.filter(p => p.id !== tempId)); // rollback
      showToast(`Could not add ${person.name}: ${err.message}`, 'amber');
      throw err;
    }
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    const previous = people.find(p => p.id === id);
    setPeople(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

    if (!activePatientId || id.startsWith('p-')) {
      showToast('Family profile updated (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      const saved = await personApi.updatePerson(id, updates);
      setPeople(prev => prev.map(p => (p.id === id ? saved : p)));
      showToast('Family profile updated.', 'success');
    } catch (err: any) {
      if (previous) setPeople(prev => prev.map(p => (p.id === id ? previous : p)));
      showToast(`Could not update profile: ${err.message}`, 'amber');
      throw err;
    }
  };

  // Routine Actions
  const addRoutineItem = async (item: Omit<RoutineItem, 'id'>) => {
    const tempId = `rout-${Date.now()}`;
    const newItem: RoutineItem = { ...item, id: tempId };
    setRoutine(prev => [...prev, newItem]);

    if (!activePatientId) {
      showToast('Routine reminder added (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      const created = await routineApi.createRoutineItem(activePatientId, item);
      setRoutine(prev => prev.map(r => (r.id === tempId ? created : r)));
      showToast('Routine reminder added.', 'success');
    } catch (err: any) {
      setRoutine(prev => prev.filter(r => r.id !== tempId)); // rollback
      showToast(`Could not add routine reminder: ${err.message}`, 'amber');
      throw err;
    }
  };

  const toggleRoutineCompleted = async (id: string) => {
    const item = routine.find(r => r.id === id);
    const newCompleted = !item?.completed;
    setRoutine(prev => prev.map(r => (r.id === id ? { ...r, completed: newCompleted } : r)));

    if (!activePatientId || id.startsWith('rout-')) return;

    try {
      const saved = await routineApi.toggleRoutineCompleted(id, newCompleted);
      setRoutine(prev => prev.map(r => (r.id === id ? saved : r)));
    } catch (err: any) {
      // rollback the toggle
      setRoutine(prev => prev.map(r => (r.id === id ? { ...r, completed: !newCompleted } : r)));
      showToast(`Could not update reminder: ${err.message}`, 'amber');
    }
  };

  const deleteRoutineItem = async (id: string) => {
    const previous = routine;
    setRoutine(prev => prev.filter(r => r.id !== id));

    if (!activePatientId || id.startsWith('rout-')) {
      showToast('Routine item removed (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      await routineApi.deleteRoutineItem(id);
      showToast('Routine item removed.', 'info');
    } catch (err: any) {
      setRoutine(previous); // rollback
      showToast(`Could not remove routine item: ${err.message}`, 'amber');
      throw err;
    }
  };

  // Diary Actions
  const updateDiary = async (updates: Partial<DiaryEntry>) => {
    const previous = diary;
    setDiary(prev => ({ ...prev, ...updates }));

    if (!activePatientId) {
      showToast('Diary entry updated (demo — not saved to a server).', 'amber');
      return;
    }

    try {
      const saved = await diaryApi.saveDiary(activePatientId, updates);
      setDiary(saved);
      showToast('Diary entry updated.', 'success');
    } catch (err: any) {
      setDiary(previous); // rollback
      showToast(`Could not save diary entry: ${err.message}`, 'amber');
      throw err;
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
        dataLoadError,
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
