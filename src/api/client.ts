import { Person, Memory, Album, RoutineItem, DiaryEntry, ChatMessage, VerificationStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Token Management
export const ACCESS_TOKEN_KEY = 'memorybridge_access_token';
export const PATIENT_TOKEN_KEY = 'memorybridge_patient_token';
export const ACTIVE_PATIENT_ID_KEY = 'memorybridge_patient_id';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getPatientToken(): string | null {
  return localStorage.getItem(PATIENT_TOKEN_KEY);
}

export function setPatientToken(token: string): void {
  localStorage.setItem(PATIENT_TOKEN_KEY, token);
}

export function getActivePatientId(): string | null {
  return localStorage.getItem(ACTIVE_PATIENT_ID_KEY);
}

export function setActivePatientId(id: string): void {
  localStorage.setItem(ACTIVE_PATIENT_ID_KEY, id);
}

// Request Helper
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken() || getPatientToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json?.error?.message || response.statusText || 'Request failed';
    const error: any = new Error(errorMsg);
    error.code = json?.error?.code;
    error.status = response.status;
    throw error;
  }

  return json.data;
}

// DTO Mappers
export function mapBackendMemoryToFrontend(m: any): Memory {
  const statusMap: Record<string, VerificationStatus> = {
    VERIFIED: 'verified',
    PENDING: 'pending',
    AI_SUGGESTED: 'ai-suggested',
    REJECTED: 'pending'
  };

  const dateStr = m.eventDate
    ? new Date(m.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : m.approximateYear
    ? String(m.approximateYear)
    : '';

  const media = (m.media || []).map((med: any) => ({
    id: med.id,
    url: med.readUrl || med.thumbnailPath || med.storagePath || '',
    type: med.mediaType?.toLowerCase() === 'video' ? 'video' : 'image',
    caption: med.caption || ''
  }));

  const peopleIds = (m.people || []).map((p: any) => p.personId || p.person?.id).filter(Boolean);

  return {
    id: m.id,
    title: m.title,
    year: m.approximateYear || (m.eventDate ? new Date(m.eventDate).getFullYear() : 2026),
    dateStr,
    location: m.location || '',
    albumId: m.albumId || '',
    peopleIds,
    media,
    story: m.story,
    audioDescription: m.audioDescription || undefined,
    status: statusMap[m.verificationStatus] || 'pending',
    source: (m.source?.toLowerCase() || 'family_submitted') as any,
    approvedBy: m.approvedById || undefined,
    era: m.era as any,
    tags: m.tags || [],
    songId: m.songId || undefined,
    mapCoordinates: m.mapX && m.mapY ? { x: m.mapX, y: m.mapY, label: m.mapLabel || m.location || '' } : undefined
  };
}

export function mapBackendPersonToFrontend(p: any): Person {
  return {
    id: p.id,
    name: p.fullName,
    relationship: p.relationship || 'Family Member',
    bio: p.biography || '',
    birthYear: p.birthYear || undefined,
    avatarUrl: p.profileImage || '/placeholders/anita.svg',
    isMainPatient: false,
    confirmedByFamily: p.confirmedByFamily ?? true,
    sharedMemoryCount: p.sharedMemoryCount || 0
  };
}

export function mapBackendRoutineToFrontend(r: any): RoutineItem {
  const periodMap: Record<string, 'Morning' | 'Afternoon' | 'Evening'> = {
    MORNING: 'Morning',
    AFTERNOON: 'Afternoon',
    EVENING: 'Evening'
  };

  return {
    id: r.id,
    title: r.title,
    time: r.scheduledTime,
    period: periodMap[r.period] || 'Morning',
    category: (r.category?.toLowerCase() || 'activity') as any,
    notes: r.notes || '',
    completed: r.completed || false,
    reminderStatus: r.reminderStatus === 'ACTIVE' ? 'Active' : 'Dismissed'
  };
}

export function mapBackendDiaryToFrontend(d: any): DiaryEntry {
  return {
    id: d.id,
    dateStr: d.date ? String(d.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    weather: d.weather,
    greeting: d.greeting,
    morningNote: d.morningNote,
    afternoonNote: d.afternoonNote,
    eveningNote: d.eveningNote,
    caregiverSign: d.caregiverSign
  };
}

export function mapBackendAlbumToFrontend(a: any): Album {
  return {
    id: a.id,
    title: a.title,
    coverUrl: a.coverImage || '',
    colorTheme: a.colorTheme || 'amber',
    yearRange: a.yearRange || '',
    description: a.description || '',
    memoryCount: a.memories?.length || 0
  };
}

// API Service Client
export const apiClient = {
  auth: {
    login: async (email: string, password: string) => {
      const data = await apiRequest<{ user: any; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setAccessToken(data.accessToken);
      return data;
    },
    register: async (name: string, email: string, password: string, role: 'CAREGIVER' | 'FAMILY_MEMBER' = 'CAREGIVER') => {
      const data = await apiRequest<{ user: any; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      setAccessToken(data.accessToken);
      return data;
    },
    logout: async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } finally {
        clearAccessToken();
      }
    },
    getMe: async () => {
      return apiRequest('/auth/me');
    }
  },

  patients: {
    list: async () => {
      return apiRequest('/patients');
    },
    createSession: async (patientId: string, durationMinutes: number = 1440) => {
      const data = await apiRequest<{ session: any; sessionToken: string }>(`/patients/${patientId}/patient-sessions`, {
        method: 'POST',
        body: JSON.stringify({ durationMinutes })
      });
      setPatientToken(data.sessionToken);
      return data;
    }
  },

  memories: {
    list: async (patientId: string): Promise<Memory[]> => {
      const raw = await apiRequest<any[]>(`/patients/${patientId}/memories`);
      return raw.map(mapBackendMemoryToFrontend);
    },
    create: async (patientId: string, memory: Omit<Memory, 'id'>): Promise<Memory> => {
      const payload = {
        title: memory.title,
        story: memory.story,
        description: memory.story,
        approximateYear: memory.year,
        location: memory.location,
        era: memory.era,
        tags: memory.tags,
        albumId: memory.albumId || undefined,
        songId: memory.songId || undefined,
        audioDescription: memory.audioDescription,
        mapX: memory.mapCoordinates?.x,
        mapY: memory.mapCoordinates?.y,
        mapLabel: memory.mapCoordinates?.label,
        peopleIds: memory.peopleIds
      };
      const raw = await apiRequest(`/patients/${patientId}/memories`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return mapBackendMemoryToFrontend(raw);
    },
    verify: async (id: string, comments?: string) => {
      const raw = await apiRequest(`/memories/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status: 'VERIFIED', comments })
      });
      return mapBackendMemoryToFrontend(raw.memory);
    },
    reject: async (id: string, comments?: string) => {
      const raw = await apiRequest(`/memories/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments })
      });
      return mapBackendMemoryToFrontend(raw.memory);
    },
    update: async (id: string, updates: Partial<Memory>) => {
      const payload: any = { ...updates };
      if (updates.year) payload.approximateYear = updates.year;
      const raw = await apiRequest(`/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return mapBackendMemoryToFrontend(raw);
    },
    delete: async (id: string) => {
      return apiRequest(`/memories/${id}`, { method: 'DELETE' });
    }
  },

  people: {
    list: async (patientId: string): Promise<Person[]> => {
      const raw = await apiRequest<any[]>(`/patients/${patientId}/people`);
      return raw.map(mapBackendPersonToFrontend);
    },
    create: async (patientId: string, person: Omit<Person, 'id'>): Promise<Person> => {
      const raw = await apiRequest(`/patients/${patientId}/people`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: person.name,
          relationship: person.relationship,
          biography: person.bio,
          birthYear: person.birthYear,
          profileImage: person.avatarUrl
        })
      });
      return mapBackendPersonToFrontend(raw);
    },
    update: async (id: string, updates: Partial<Person>) => {
      const raw = await apiRequest(`/people/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: updates.name,
          biography: updates.bio,
          birthYear: updates.birthYear,
          profileImage: updates.avatarUrl
        })
      });
      return mapBackendPersonToFrontend(raw);
    },
    delete: async (id: string) => {
      return apiRequest(`/people/${id}`, { method: 'DELETE' });
    }
  },

  albums: {
    list: async (patientId: string): Promise<Album[]> => {
      const raw = await apiRequest<any[]>(`/patients/${patientId}/albums`);
      return raw.map(mapBackendAlbumToFrontend);
    }
  },

  routine: {
    list: async (patientId: string): Promise<RoutineItem[]> => {
      const raw = await apiRequest<any[]>(`/patients/${patientId}/routine`);
      return raw.map(mapBackendRoutineToFrontend);
    },
    create: async (patientId: string, item: Omit<RoutineItem, 'id'>): Promise<RoutineItem> => {
      const raw = await apiRequest(`/patients/${patientId}/routine`, {
        method: 'POST',
        body: JSON.stringify({
          title: item.title,
          scheduledTime: item.time,
          period: item.period,
          category: item.category,
          notes: item.notes
        })
      });
      return mapBackendRoutineToFrontend(raw);
    },
    toggleComplete: async (id: string, completed?: boolean): Promise<RoutineItem> => {
      const raw = await apiRequest(`/routine/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completed })
      });
      return mapBackendRoutineToFrontend(raw);
    },
    delete: async (id: string) => {
      return apiRequest(`/routine/${id}`, { method: 'DELETE' });
    }
  },

  diary: {
    get: async (patientId: string, dateStr?: string): Promise<DiaryEntry | null> => {
      const raw = await apiRequest(`/patients/${patientId}/diary${dateStr ? `?date=${dateStr}` : ''}`);
      return raw ? mapBackendDiaryToFrontend(raw) : null;
    },
    upsert: async (patientId: string, entry: Partial<DiaryEntry>): Promise<DiaryEntry> => {
      const raw = await apiRequest(`/patients/${patientId}/diary`, {
        method: 'PUT',
        body: JSON.stringify({
          date: entry.dateStr || new Date().toISOString().slice(0, 10),
          weather: entry.weather,
          greeting: entry.greeting,
          morningNote: entry.morningNote,
          afternoonNote: entry.afternoonNote,
          eveningNote: entry.eveningNote,
          caregiverSign: entry.caregiverSign
        })
      });
      return mapBackendDiaryToFrontend(raw);
    }
  },

  companion: {
    sendMessage: async (patientId: string, message: string, conversationId?: string): Promise<{
      conversationId: string;
      messageId: string;
      text: string;
      suggestedPrompts: string[];
      memoryCard?: Memory;
    }> => {
      const raw = await apiRequest(`/patients/${patientId}/conversations/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, conversationId })
      });
      return {
        conversationId: raw.conversationId,
        messageId: raw.messageId,
        text: raw.text,
        suggestedPrompts: raw.suggestedPrompts,
        memoryCard: raw.memoryCard ? mapBackendMemoryToFrontend(raw.memoryCard) : undefined
      };
    }
  }
};
