/**
 * MemoryBridge Centralized API Client & Service Modules
 *
 * Implements strict response envelope unwrapping { data, error },
 * automatic token management (Bearer accessToken), session handling,
 * and bidirectional DTO adapters between backend and frontend.
 */

import {
  Person,
  Memory,
  Album,
  RoutineItem,
  DiaryEntry,
  VerificationStatus,
  ChatMessage
} from '../types';

// API Base URL from environment or dev proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Token Storage Keys
const TOKEN_KEY = 'mb_access_token';
const PATIENT_SESSION_KEY = 'mb_patient_session_token';
const ACTIVE_PATIENT_KEY = 'mb_active_patient_id';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// -------------------------------------------------------------
// Token & Session Helpers
// -------------------------------------------------------------
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getPatientSessionToken(): string | null {
  return localStorage.getItem(PATIENT_SESSION_KEY);
}

export function setPatientSessionToken(token: string | null): void {
  if (token) {
    localStorage.setItem(PATIENT_SESSION_KEY, token);
  } else {
    localStorage.removeItem(PATIENT_SESSION_KEY);
  }
}

export function getActivePatientId(): string | null {
  return localStorage.getItem(ACTIVE_PATIENT_KEY);
}

export function setActivePatientId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PATIENT_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PATIENT_KEY);
  }
}

export function clearAllTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PATIENT_SESSION_KEY);
  localStorage.removeItem(ACTIVE_PATIENT_KEY);
}

// -------------------------------------------------------------
// Central Request Executor
// -------------------------------------------------------------
interface RequestOptions extends RequestInit {
  usePatientToken?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  // Add Content-Type if body is JSON
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  // Determine token: User access token vs Patient tablet session token
  const userToken = getAccessToken();
  const patientToken = getPatientSessionToken();

  if (options.usePatientToken && patientToken) {
    headers.set('Authorization', `Bearer ${patientToken}`);
  } else if (userToken) {
    headers.set('Authorization', `Bearer ${userToken}`);
  } else if (patientToken) {
    headers.set('Authorization', `Bearer ${patientToken}`);
  }

  // Include credentials for HttpOnly refresh cookies
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiError('NETWORK_ERROR', `Unable to reach backend: ${err.message}`, 0);
  }

  // Attempt token refresh on 401 if we have a user token that expired
  if (response.status === 401 && userToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newToken = refreshJson.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...config, headers });
        }
      } else {
        setAccessToken(null);
      }
    } catch {
      setAccessToken(null);
    }
  }

  // Parse JSON response
  let json: any;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      'INVALID_RESPONSE',
      `Unexpected response from server (${response.status})`,
      response.status
    );
  }

  // Strict { data, error } envelope handling
  if (!response.ok || json.error) {
    const errObj = json.error || {};
    throw new ApiError(
      errObj.code || 'API_ERROR',
      errObj.message || 'An unexpected server error occurred',
      response.status,
      errObj.details
    );
  }

  return json.data as T;
}

// -------------------------------------------------------------
// DTO Mappers
// -------------------------------------------------------------
export function toFrontendMemory(b: any): Memory {
  // Normalize verification status
  let status: VerificationStatus = 'pending';
  const bStatus = (b.verificationStatus || '').toUpperCase();
  if (bStatus === 'VERIFIED') status = 'verified';
  else if (bStatus === 'AI_SUGGESTED') status = 'ai-suggested';
  else status = 'pending';

  // Format year & date string
  const year = b.approximateYear || (b.eventDate ? new Date(b.eventDate).getFullYear() : 1970);
  const dateStr = b.eventDate
    ? new Date(b.eventDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : `${year}`;

  // Map era
  let era = b.era || 'Career';
  if (era === 'EARLY') era = 'Childhood';
  else if (era === 'MID') era = 'College';
  else if (era === 'LATE') era = 'Golden Years';

  // Map source
  let source: Memory['source'] = 'caregiver';
  const bSource = (b.source || '').toUpperCase();
  if (bSource === 'FAMILY_SUBMITTED') source = 'family_submitted';
  else if (bSource === 'AI_DRAFTED') source = 'ai_drafted';

  // Map media items
  const media = (b.media || []).map((m: any) => ({
    id: m.id,
    url: m.url || '',
    type: (m.mediaType || '').toUpperCase() === 'VIDEO' ? 'video' : 'image',
    caption: m.caption || ''
  }));

  // Map people IDs
  const peopleIds = (b.people || []).map((p: any) => p.personId || p.person?.id || p.id).filter(Boolean);

  return {
    id: b.id,
    title: b.title || 'Untitled Memory',
    year,
    dateStr,
    location: b.location || '',
    albumId: b.albumId || 'album-all',
    peopleIds,
    media,
    story: b.story || '',
    audioDescription: b.audioDescription,
    status,
    source,
    approvedBy: b.approvedBy?.name || b.approvedBy || undefined,
    era: era as Memory['era'],
    tags: Array.isArray(b.tags) ? b.tags : [],
    songId: b.songId
  };
}

export function toFrontendPerson(b: any): Person {
  return {
    id: b.id,
    name: b.fullName || 'Family Member',
    relationship: b.relationship || (b.isMainPatient ? 'Self' : 'Family'),
    bio: b.biography || '',
    birthYear: b.birthYear || undefined,
    avatarUrl: b.profileImage || '/placeholders/avatar.svg',
    isMainPatient: !!b.isMainPatient,
    confirmedByFamily: b.confirmedByFamily ?? true,
    sharedMemoryCount: b.sharedMemoryCount ?? (b._count?.memories || 0)
  };
}

export function toFrontendAlbum(b: any): Album {
  return {
    id: b.id,
    title: b.title,
    coverUrl: b.coverImage || '/placeholders/album-cover.svg',
    colorTheme: b.colorTheme || 'blue',
    yearRange: b.yearRange || '',
    description: b.description || '',
    memoryCount: b.memoryCount ?? (b._count?.memories || 0)
  };
}

export function toFrontendRoutine(b: any): RoutineItem {
  let period: RoutineItem['period'] = 'Morning';
  const p = (b.period || '').toUpperCase();
  if (p === 'AFTERNOON') period = 'Afternoon';
  else if (p === 'EVENING') period = 'Evening';

  let category: RoutineItem['category'] = 'activity';
  const c = (b.category || '').toLowerCase();
  if (['activity', 'meal', 'medication', 'family_call', 'walk'].includes(c)) {
    category = c as RoutineItem['category'];
  }

  return {
    id: b.id,
    title: b.title,
    time: b.scheduledTime || '10:00 AM',
    period,
    category,
    notes: b.notes || '',
    completed: !!b.completed,
    reminderStatus: b.reminderStatus === 'DISMISSED' ? 'Dismissed' : 'Active'
  };
}

export function toFrontendDiary(b: any): DiaryEntry {
  if (!b) {
    return {
      id: 'today',
      dateStr: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      weather: 'Pleasant & Mild, 22°C',
      greeting: 'Good evening, Rajiv.',
      morningNote: 'Walked in the morning sunlight.',
      afternoonNote: 'Looked at cherished family photographs.',
      eveningNote: 'Listened to classical music and enjoyed tea.',
      caregiverSign: 'Anita'
    };
  }
  return {
    id: b.id,
    dateStr: b.date ? new Date(b.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Today',
    weather: b.weather || 'Pleasant & Mild, 22°C',
    greeting: b.greeting || 'Good evening.',
    morningNote: b.morningNote || '',
    afternoonNote: b.afternoonNote || '',
    eveningNote: b.eveningNote || '',
    caregiverSign: b.caregiverSign || 'Caregiver'
  };
}

// -------------------------------------------------------------
// Specialized Service Modules
// -------------------------------------------------------------

export const authApi = {
  async register(data: { email: string; password: string; name: string; role?: string }) {
    const res = await apiRequest<{ user: any; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await apiRequest<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearAllTokens();
    }
  },

  async me() {
    return apiRequest<{ user: any }>('/auth/me');
  }
};

export const patientApi = {
  async listPatients() {
    return apiRequest<any[]>('/patients');
  },

  async getPatient(id: string) {
    return apiRequest<any>(`/patients/${id}`);
  },

  async createPatient(data: { fullName: string; dateOfBirth?: string; relationship: string }) {
    return apiRequest<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async createTabletSession(patientId: string, label: string = 'Tablet') {
    const res = await apiRequest<{ sessionToken: string; session: any }>(
      `/patients/${patientId}/patient-sessions`,
      {
        method: 'POST',
        body: JSON.stringify({ deviceLabel: label })
      }
    );
    if (res.sessionToken) {
      setPatientSessionToken(res.sessionToken);
      setActivePatientId(patientId);
    }
    return res;
  },

  async resetDemoData(patientId: string) {
    return apiRequest<{ message: string }>(`/patients/${patientId}/reset-demo`, {
      method: 'POST'
    });
  }
};

export interface PatientInvitation {
  id: string;
  accessRole: 'FAMILY' | 'VIEWER';
  relationship: string;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: 'ACTIVE' | 'REDEEMED' | 'REVOKED' | 'EXPIRED';
}

export const invitationApi = {
  async create(
    patientId: string,
    input: { accessRole: 'FAMILY' | 'VIEWER'; relationship: string; expiresInHours: number }
  ) {
    return apiRequest<PatientInvitation & { code: string; patientId: string }>(
      `/patients/${patientId}/invitations`,
      { method: 'POST', body: JSON.stringify(input) }
    );
  },

  async list(patientId: string) {
    return apiRequest<PatientInvitation[]>(`/patients/${patientId}/invitations`);
  },

  async revoke(patientId: string, invitationId: string) {
    return apiRequest<{ id: string; revokedAt: string }>(
      `/patients/${patientId}/invitations/${invitationId}`,
      { method: 'DELETE' }
    );
  },

  async redeem(code: string) {
    return apiRequest<{
      patient: { id: string; fullName: string; profileImage?: string | null };
      accessRole: 'FAMILY' | 'VIEWER';
      relationship: string;
      redeemedAt: string;
    }>('/invitations/redeem', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }
};

export const memoryApi = {
  async listMemories(patientId: string, page = 1, pageSize = 50) {
    const res = await apiRequest<{ items: any[]; total: number }>(
      `/patients/${patientId}/memories?page=${page}&pageSize=${pageSize}`
    );
    return {
      items: (res.items || []).map(toFrontendMemory),
      total: res.total
    };
  },

  async searchMemories(patientId: string, query: { q?: string; year?: number; era?: string }) {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.year) params.set('year', query.year.toString());
    if (query.era) params.set('era', query.era);

    const res = await apiRequest<{ items: any[]; total: number }>(
      `/patients/${patientId}/memories/search?${params.toString()}`
    );
    return (res.items || []).map(toFrontendMemory);
  },

  async getMemory(id: string) {
    const res = await apiRequest<any>(`/memories/${id}`);
    return toFrontendMemory(res);
  },

  async createMemory(patientId: string, memory: Omit<Memory, 'id'>) {
    const payload = {
      title: memory.title,
      story: memory.story,
      approximateYear: memory.year,
      location: memory.location,
      albumId: memory.albumId && memory.albumId !== 'album-all' ? memory.albumId : undefined,
      peopleIds: memory.peopleIds,
      era: memory.era === 'Childhood' ? 'EARLY' : memory.era === 'Golden Years' ? 'LATE' : 'MID',
      tags: memory.tags || []
    };
    const res = await apiRequest<any>(`/patients/${patientId}/memories`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return toFrontendMemory(res);
  },

  async updateMemory(id: string, updates: Partial<Memory>) {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.story !== undefined) payload.story = updates.story;
    if (updates.year !== undefined) payload.approximateYear = updates.year;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.albumId !== undefined) payload.albumId = updates.albumId;
    if (updates.peopleIds !== undefined) payload.peopleIds = updates.peopleIds;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    const res = await apiRequest<any>(`/memories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return toFrontendMemory(res);
  },

  async deleteMemory(id: string) {
    return apiRequest<{ id: string }>(`/memories/${id}`, {
      method: 'DELETE'
    });
  },

  async verifyMemory(id: string, comments = 'Approved by caregiver') {
    const res = await apiRequest<any>(`/memories/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    });
    return toFrontendMemory(res);
  },

  async rejectMemory(id: string, reason = 'Declined by caregiver') {
    const res = await apiRequest<any>(`/memories/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return toFrontendMemory(res);
  }
};

export const personApi = {
  async listPeople(patientId: string) {
    const res = await apiRequest<{ items: any[] }>(`/patients/${patientId}/people`);
    return (res.items || []).map(toFrontendPerson);
  },

  async createPerson(patientId: string, person: Omit<Person, 'id'>) {
    const payload = {
      fullName: person.name,
      relationship: person.relationship,
      biography: person.bio,
      birthYear: person.birthYear,
      confirmedByFamily: person.confirmedByFamily
    };
    const res = await apiRequest<any>(`/patients/${patientId}/people`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return toFrontendPerson(res);
  },

  async updatePerson(id: string, updates: Partial<Person>) {
    const payload: any = {};
    if (updates.name !== undefined) payload.fullName = updates.name;
    if (updates.relationship !== undefined) payload.relationship = updates.relationship;
    if (updates.bio !== undefined) payload.biography = updates.bio;
    if (updates.birthYear !== undefined) payload.birthYear = updates.birthYear;
    if (updates.confirmedByFamily !== undefined) payload.confirmedByFamily = updates.confirmedByFamily;

    const res = await apiRequest<any>(`/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return toFrontendPerson(res);
  },

  async deletePerson(id: string) {
    return apiRequest<{ id: string }>(`/people/${id}`, {
      method: 'DELETE'
    });
  }
};

export const albumApi = {
  async listAlbums(patientId: string) {
    const res = await apiRequest<any[]>(`/patients/${patientId}/albums`);
    return (res || []).map(toFrontendAlbum);
  },

  async createAlbum(patientId: string, album: Omit<Album, 'id'>) {
    const payload = {
      title: album.title,
      colorTheme: album.colorTheme,
      description: album.description
    };
    const res = await apiRequest<any>(`/patients/${patientId}/albums`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return toFrontendAlbum(res);
  }
};

export const routineApi = {
  async listRoutine(patientId: string) {
    const res = await apiRequest<any[]>(`/patients/${patientId}/routine`);
    return (res || []).map(toFrontendRoutine);
  },

  async createRoutineItem(patientId: string, item: Omit<RoutineItem, 'id'>) {
    const payload = {
      title: item.title,
      scheduledTime: item.time,
      period: item.period.toUpperCase(),
      category: item.category.toUpperCase(),
      notes: item.notes
    };
    const res = await apiRequest<any>(`/patients/${patientId}/routine`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return toFrontendRoutine(res);
  },

  async toggleRoutineCompleted(id: string, completed?: boolean) {
    const res = await apiRequest<any>(`/routine/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ completed })
    });
    return toFrontendRoutine(res);
  },

  async deleteRoutineItem(id: string) {
    return apiRequest<{ id: string }>(`/routine/${id}`, {
      method: 'DELETE'
    });
  }
};

export const diaryApi = {
  async getDiary(patientId: string, dateStr?: string) {
    const dateQuery = dateStr ? `?date=${dateStr}` : '';
    const res = await apiRequest<any>(`/patients/${patientId}/diary${dateQuery}`);
    return toFrontendDiary(res);
  },

  async saveDiary(patientId: string, diary: Partial<DiaryEntry>) {
    const payload = {
      weather: diary.weather,
      greeting: diary.greeting,
      morningNote: diary.morningNote,
      afternoonNote: diary.afternoonNote,
      eveningNote: diary.eveningNote,
      caregiverSign: diary.caregiverSign
    };
    const res = await apiRequest<any>(`/patients/${patientId}/diary`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return toFrontendDiary(res);
  }
};

export const dashboardApi = {
  async getDashboard(patientId: string) {
    return apiRequest<{
      patient: any;
      counts: {
        memories: number;
        verified: number;
        pending: number;
        aiSuggested: number;
        people: number;
        albums: number;
        routineTotal: number;
        routineCompleted: number;
      };
      recentMemories: any[];
      todayRoutine: any[];
      diarySnippet: any;
    }>(`/patients/${patientId}/dashboard`);
  },

  async getGraph(patientId: string) {
    return apiRequest<{
      nodes: Array<{ id: string; label: string; type: string; details?: any }>;
      edges: Array<{ from: string; to: string; type: string; label?: string }>;
    }>(`/patients/${patientId}/graph`);
  }
};

export const companionApi = {
  async sendMessage(patientId: string, text: string): Promise<ChatMessage> {
    const res = await apiRequest<{
      reply: string;
      memoryCard?: any;
      suggestedMemories?: any[];
      suggestedPrompts?: string[];
    }>(`/patients/${patientId}/companion/message`, {
      method: 'POST',
      body: JSON.stringify({ text }),
      usePatientToken: true
    });

    const matchedMemory = res.memoryCard || res.suggestedMemories?.[0];

    return {
      id: `comp-${Date.now()}`,
      sender: 'companion',
      text: res.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      memoryCard: matchedMemory ? toFrontendMemory(matchedMemory) : undefined,
      suggestedPrompts: res.suggestedPrompts
    };
  }
};

// -------------------------------------------------------------
// Phase 6 Private Media Upload Pipeline (Direct PUT V4 Workflow)
// -------------------------------------------------------------
export interface UploadMediaOptions {
  purpose?: 'MEMORY_MEDIA' | 'PATIENT_PROFILE' | 'PERSON_PROFILE' | 'ALBUM_COVER' | 'STORYBOOK_COVER';
  memoryId?: string;
  targetId?: string;
  caption?: string;
  onProgress?: (percent: number) => void;
}

export const mediaApi = {
  /**
   * Complete 3-step secure upload workflow:
   * 1. Validate file type and size on client
   * 2. Request signed upload URL and intent from backend
   * 3. Direct binary PUT upload to storage target
   * 4. Confirm upload with backend and get verified Media record
   */
  async uploadFile(patientId: string, file: File, options: UploadMediaOptions = {}) {
    // 1. Client-side size & MIME validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    const type = file.type.toLowerCase();

    // Size caps from Phase 6 rules: 10MB images, 25MB audio, 200MB video
    let maxSize = 10 * 1024 * 1024; // 10MB default
    if (type.startsWith('audio/')) maxSize = 25 * 1024 * 1024;
    if (type.startsWith('video/')) maxSize = 200 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new ApiError(
        'FILE_TOO_LARGE',
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
        400
      );
    }

    // Supported MIME types allowlist
    const supportedMimes = [
      'image/jpeg', 'image/png', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a',
      'video/mp4', 'video/webm'
    ];
    if (!supportedMimes.some(m => type.startsWith(m))) {
      throw new ApiError(
        'UNSUPPORTED_TYPE',
        `File format "${file.type || ext}" is not supported. Please upload JPG, PNG, WEBP, MP3, WAV, or MP4.`,
        400
      );
    }

    // 2. Request signed upload URL & intent
    const urlPayload = {
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      sizeBytes: file.size,
      purpose: options.purpose || 'MEMORY_MEDIA',
      memoryId: options.memoryId,
      targetId: options.targetId
    };

    const intentRes = await apiRequest<{
      uploadId: string;
      uploadUrl: string;
      method: string;
      requiredHeaders?: Record<string, string>;
      expiresAt: string;
    }>(`/patients/${patientId}/media/upload-url`, {
      method: 'POST',
      body: JSON.stringify(urlPayload)
    });

    const { uploadId, uploadUrl, requiredHeaders } = intentRes;

    // 3. Direct binary PUT upload to storage target
    const targetUrl = uploadUrl.startsWith('http') ? uploadUrl : `${uploadUrl}`;
    const uploadHeaders: Record<string, string> = {
      'Content-Type': file.type || 'application/octet-stream',
      ...(requiredHeaders || {})
    };

    const putRes = await fetch(targetUrl, {
      method: 'PUT',
      headers: uploadHeaders,
      body: file
    });

    if (!putRes.ok) {
      throw new ApiError(
        'STORAGE_UPLOAD_FAILED',
        `Storage upload failed with status ${putRes.status}`,
        putRes.status
      );
    }

    // 4. Confirm upload with backend
    const confirmRes = await apiRequest<any>(`/patients/${patientId}/media/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        uploadId,
        caption: options.caption,
        memoryId: options.memoryId
      })
    });

    return confirmRes;
  },

  async getMediaUrl(mediaId: string): Promise<string> {
    const res = await apiRequest<{ url: string }>(`/media/${mediaId}/url`);
    return res.url;
  },

  async deleteMedia(mediaId: string) {
    return apiRequest<{ id: string }>(`/media/${mediaId}`, {
      method: 'DELETE'
    });
  }
};
