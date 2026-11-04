import { prisma } from '../config/prisma.js';

export interface UpsertDiaryInput {
  date: string; // YYYY-MM-DD
  weather: string;
  greeting: string;
  morningNote: string;
  afternoonNote: string;
  eveningNote: string;
  caregiverSign: string;
}

export class DiaryService {
  async getDiaryEntry(patientId: string, dateStr: string) {
    const date = new Date(dateStr);

    return prisma.diaryEntry.findFirst({
      where: {
        patientId,
        date
      }
    });
  }

  async upsertDiaryEntry(patientId: string, input: UpsertDiaryInput) {
    const date = new Date(input.date);

    return prisma.diaryEntry.upsert({
      where: {
        patientId_date: {
          patientId,
          date
        }
      },
      create: {
        patientId,
        date,
        weather: input.weather,
        greeting: input.greeting,
        morningNote: input.morningNote,
        afternoonNote: input.afternoonNote,
        eveningNote: input.eveningNote,
        caregiverSign: input.caregiverSign
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
  }
}

export const diaryService = new DiaryService();
