import { Prisma, DiaryEntry } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class DiaryRepository {
  async findById(id: string): Promise<DiaryEntry | null> {
    return prisma.diaryEntry.findUnique({
      where: { id }
    });
  }

  async findByPatientAndDate(patientId: string, date: Date): Promise<DiaryEntry | null> {
    return prisma.diaryEntry.findUnique({
      where: {
        patientId_date: { patientId, date }
      }
    });
  }

  async findMany(params: {
    where: Prisma.DiaryEntryWhereInput;
    orderBy: Prisma.DiaryEntryOrderByWithRelationInput[];
    skip: number;
    take: number;
  }): Promise<DiaryEntry[]> {
    return prisma.diaryEntry.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.DiaryEntryWhereInput): Promise<number> {
    return prisma.diaryEntry.count({ where });
  }

  async upsert(patientId: string, date: Date, data: Omit<Prisma.DiaryEntryCreateInput, 'patient'>): Promise<DiaryEntry> {
    return prisma.diaryEntry.upsert({
      where: {
        patientId_date: { patientId, date }
      },
      create: {
        ...data,
        date,
        patient: { connect: { id: patientId } }
      },
      update: {
        weather: data.weather,
        greeting: data.greeting,
        morningNote: data.morningNote,
        afternoonNote: data.afternoonNote,
        eveningNote: data.eveningNote,
        caregiverSign: data.caregiverSign
      }
    });
  }

  async update(id: string, data: Prisma.DiaryEntryUpdateInput): Promise<DiaryEntry> {
    return prisma.diaryEntry.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<DiaryEntry> {
    return prisma.diaryEntry.delete({
      where: { id }
    });
  }
}

export const diaryRepository = new DiaryRepository();

