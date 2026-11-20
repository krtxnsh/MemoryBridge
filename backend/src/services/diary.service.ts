import { Prisma, DiaryEntry } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { diaryRepository } from '../repositories/diary.repository.js';
import { AppError } from '../middleware/errorHandler.js';

export class DiaryService {
  private formatDiaryEntry(entry: DiaryEntry) {
    const dateObj = new Date(entry.date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const combinedText = [entry.morningNote, entry.afternoonNote, entry.eveningNote]
      .filter(Boolean)
      .join('\n\n');

    return {
      id: entry.id,
      patientId: entry.patientId,
      date: entry.date,
      dateStr,
      weather: entry.weather,
      greeting: entry.greeting,
      morningNote: entry.morningNote,
      afternoonNote: entry.afternoonNote,
      eveningNote: entry.eveningNote,
      caregiverSign: entry.caregiverSign,
      audioUrl: null, // Audio recorded/signed URLs in Phase 6
      text: combinedText,
      prompt: entry.greeting,
      mood: entry.weather,
      patientMood: entry.weather,
      recordedAt: entry.date,
      isFavorite: false,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };
  }

  async listDiary(
    patientId: string,
    params: {
      date?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const where: Prisma.DiaryEntryWhereInput = {
      patientId
    };

    if (params.date) {
      const targetDate = new Date(params.date);
      where.date = targetDate;
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      diaryRepository.findMany({
        where,
        orderBy: [{ date: 'desc' }],
        skip,
        take
      }),
      diaryRepository.count(where)
    ]);

    return {
      items: items.map((d) => this.formatDiaryEntry(d)),
      page,
      pageSize,
      total
    };
  }

  async getDiaryById(id: string) {
    const entry = await diaryRepository.findById(id);
    if (!entry) {
      throw new AppError('DIARY_NOT_FOUND', 'Diary entry not found.', 404);
    }
    return this.formatDiaryEntry(entry);
  }

  async createOrUpsertDiary(
    patientId: string,
    userId: string,
    input: {
      date?: string;
      weather?: string;
      greeting?: string;
      morningNote?: string;
      afternoonNote?: string;
      eveningNote?: string;
      caregiverSign?: string;
    }
  ) {
    const dateObj = input.date ? new Date(input.date) : new Date();
    // Normalize to date only (00:00:00 UTC)
    dateObj.setUTCHours(0, 0, 0, 0);

    const entry = await prisma.$transaction(async (tx) => {
      const saved = await tx.diaryEntry.upsert({
        where: {
          patientId_date: { patientId, date: dateObj }
        },
        create: {
          patientId,
          date: dateObj,
          weather: input.weather || 'Sunny & Warm',
          greeting: input.greeting || 'Good Evening',
          morningNote: input.morningNote || '',
          afternoonNote: input.afternoonNote || '',
          eveningNote: input.eveningNote || '',
          caregiverSign: input.caregiverSign || 'Care Team'
        },
        update: {
          weather: input.weather,
          greeting: input.greeting,
          morningNote: input.morningNote,
          afternoonNote: input.afternoonNote,
          eveningNote: input.eveningNote,
          caregiverSign: input.caregiverSign
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'SAVE_DIARY',
          resourceType: 'DiaryEntry',
          resourceId: saved.id,
          metadata: { date: dateObj.toISOString() }
        }
      });

      return saved;
    });

    return this.formatDiaryEntry(entry);
  }

  async updateDiary(
    id: string,
    userId: string,
    input: {
      weather?: string;
      greeting?: string;
      morningNote?: string;
      afternoonNote?: string;
      eveningNote?: string;
      caregiverSign?: string;
    }
  ) {
    const existing = await diaryRepository.findById(id);
    if (!existing) {
      throw new AppError('DIARY_NOT_FOUND', 'Diary entry not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.diaryEntry.update({
        where: { id },
        data: input
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'UPDATE_DIARY',
          resourceType: 'DiaryEntry',
          resourceId: id
        }
      });

      return res;
    });

    return this.formatDiaryEntry(updated);
  }

  async deleteDiary(id: string, userId: string) {
    const existing = await diaryRepository.findById(id);
    if (!existing) {
      throw new AppError('DIARY_NOT_FOUND', 'Diary entry not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.diaryEntry.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'DELETE_DIARY',
          resourceType: 'DiaryEntry',
          resourceId: id
        }
      });
    });

    return { id };
  }
}

export const diaryService = new DiaryService();

