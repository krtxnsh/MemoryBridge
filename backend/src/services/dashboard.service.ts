import { Prisma, AccessRole, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { formatDisplayTime } from './routine.service.js';

export class DashboardService {
  async getDashboard(
    patientId: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const patient = await prisma.patientProfile.findFirst({
      where: { id: patientId, deletedAt: null }
    });

    if (!patient) {
      throw new AppError('PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
    }

    // Build memory visibility filter
    const memoryFilter: Prisma.MemoryWhereInput = {
      patientId,
      deletedAt: null
    };

    if (context.isPatientSession || context.accessRole === AccessRole.VIEWER) {
      memoryFilter.verificationStatus = VerificationStatus.VERIFIED;
    } else if (context.accessRole === AccessRole.FAMILY) {
      memoryFilter.OR = [
        { verificationStatus: VerificationStatus.VERIFIED },
        { createdBy: context.userId }
      ];
    }

    // Build people visibility filter
    const peopleFilter: Prisma.PersonWhereInput = {
      patientId,
      deletedAt: null
    };
    if (context.isPatientSession) {
      peopleFilter.confirmedByFamily = true;
    }

    // Current time in HH:mm for upcoming routine
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentHHmm = `${currentH < 10 ? '0' : ''}${currentH}:${currentM < 10 ? '0' : ''}${currentM}`;

    // Parallel queries to prevent N+1 overhead
    const [
      totalMemories,
      verifiedMemories,
      totalPeople,
      recentMemories,
      upcomingRoutineItems,
      recentDiaryEntry
    ] = await Promise.all([
      prisma.memory.count({ where: memoryFilter }),
      prisma.memory.count({
        where: { patientId, deletedAt: null, verificationStatus: VerificationStatus.VERIFIED }
      }),
      prisma.person.count({ where: peopleFilter }),
      prisma.memory.findMany({
        where: memoryFilter,
        orderBy: [{ createdAt: 'desc' }],
        take: 5,
        include: {
          album: { select: { id: true, title: true } },
          media: {
            where: { deletedAt: null },
            select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
          }
        }
      }),
      prisma.routineItem.findMany({
        where: {
          patientId,
          completed: false,
          scheduledTime: { gte: currentHHmm }
        },
        orderBy: [{ scheduledTime: 'asc' }],
        take: 5
      }),
      prisma.diaryEntry.findFirst({
        where: { patientId },
        orderBy: [{ date: 'desc' }]
      })
    ]);

    return {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        profileImage: patient.profileImage,
        preferredLanguage: patient.preferredLanguage,
        biography: patient.biography
      },
      stats: {
        totalMemories,
        verifiedMemories,
        totalPeople
      },
      recentMemories: recentMemories.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        eventDate: m.eventDate,
        approximateYear: m.approximateYear,
        location: m.location,
        era: m.era,
        verificationStatus: m.verificationStatus,
        album: m.album,
        media: m.media.map((med) => ({
          id: med.id,
          mediaType: med.mediaType,
          fileName: med.fileName,
          mimeType: med.mimeType,
          caption: med.caption,
          url: null
        }))
      })),
      upcomingRoutine: upcomingRoutineItems.map((item) => ({
        id: item.id,
        title: item.title,
        scheduledTime: item.scheduledTime,
        displayTime: formatDisplayTime(item.scheduledTime),
        period: item.period,
        category: item.category,
        completed: item.completed
      })),
      recentDiary: recentDiaryEntry
        ? {
            id: recentDiaryEntry.id,
            date: recentDiaryEntry.date,
            weather: recentDiaryEntry.weather,
            greeting: recentDiaryEntry.greeting,
            morningNote: recentDiaryEntry.morningNote,
            afternoonNote: recentDiaryEntry.afternoonNote,
            eveningNote: recentDiaryEntry.eveningNote,
            caregiverSign: recentDiaryEntry.caregiverSign
          }
        : null
    };
  }
}

export const dashboardService = new DashboardService();

