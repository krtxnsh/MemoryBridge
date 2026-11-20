import { Prisma, RoutinePeriod, RoutineCategory, ReminderStatus, RoutineItem } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { routineRepository } from '../repositories/routine.repository.js';
import { AppError } from '../middleware/errorHandler.js';

export function formatDisplayTime(time24: string): string {
  const parts = time24.split(':');
  if (parts.length !== 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const hStr = displayH < 10 ? `0${displayH}` : `${displayH}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr} ${period}`;
}

export class RoutineService {
  /**
   * IMPORTANT SCHEMA LIMITATION:
   * RoutineItem has no 'date' column in the Prisma schema.
   * Therefore, filtering by date and persistent daily completion resets across past dates
   * are NOT possible without schema expansion.
   * Upcoming items are evaluated as: not-completed items scheduled later than current time today,
   * ordered by scheduledTime ASC.
   */
  private formatRoutineItem(item: RoutineItem) {
    return {
      id: item.id,
      patientId: item.patientId,
      title: item.title,
      scheduledTime: item.scheduledTime, // "08:30"
      displayTime: formatDisplayTime(item.scheduledTime), // "08:30 AM"
      period: item.period,
      category: item.category,
      notes: item.notes,
      completed: item.completed,
      reminderStatus: item.reminderStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  async listRoutine(
    patientId: string,
    params: {
      period?: RoutinePeriod;
      category?: RoutineCategory;
      completed?: boolean;
      reminderStatus?: ReminderStatus;
      upcoming?: boolean;
      page?: number;
      pageSize?: number;
    }
  ) {
    const where: Prisma.RoutineItemWhereInput = {
      patientId
    };

    if (params.period) where.period = params.period;
    if (params.category) where.category = params.category;
    if (params.completed !== undefined) where.completed = params.completed;
    if (params.reminderStatus) where.reminderStatus = params.reminderStatus;

    if (params.upcoming) {
      // Find current time formatted as HH:mm
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentHHmm = `${currentH < 10 ? '0' : ''}${currentH}:${currentM < 10 ? '0' : ''}${currentM}`;

      where.completed = false;
      where.scheduledTime = { gte: currentHHmm };
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      routineRepository.findMany({
        where,
        orderBy: [{ scheduledTime: 'asc' }],
        skip,
        take
      }),
      routineRepository.count(where)
    ]);

    return {
      items: items.map((item) => this.formatRoutineItem(item)),
      page,
      pageSize,
      total
    };
  }

  async getRoutineById(id: string) {
    const item = await routineRepository.findById(id);
    if (!item) {
      throw new AppError('ROUTINE_NOT_FOUND', 'Routine item not found.', 404);
    }
    return this.formatRoutineItem(item);
  }

  async createRoutine(
    patientId: string,
    userId: string,
    input: {
      title: string;
      scheduledTime: string;
      period: RoutinePeriod;
      category: RoutineCategory;
      notes?: string | null;
      completed?: boolean;
      reminderStatus?: ReminderStatus;
    }
  ) {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.routineItem.create({
        data: {
          patientId,
          createdBy: userId,
          title: input.title,
          scheduledTime: input.scheduledTime,
          period: input.period,
          category: input.category,
          notes: input.notes || null,
          completed: input.completed ?? false,
          reminderStatus: input.reminderStatus ?? ReminderStatus.ACTIVE
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_ROUTINE',
          resourceType: 'RoutineItem',
          resourceId: created.id,
          metadata: { title: created.title, scheduledTime: created.scheduledTime }
        }
      });

      return created;
    });

    return this.formatRoutineItem(item);
  }

  async updateRoutine(
    id: string,
    userId: string,
    input: {
      title?: string;
      scheduledTime?: string;
      period?: RoutinePeriod;
      category?: RoutineCategory;
      notes?: string | null;
      completed?: boolean;
      reminderStatus?: ReminderStatus;
    }
  ) {
    const existing = await routineRepository.findById(id);
    if (!existing) {
      throw new AppError('ROUTINE_NOT_FOUND', 'Routine item not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.routineItem.update({
        where: { id },
        data: {
          title: input.title,
          scheduledTime: input.scheduledTime,
          period: input.period,
          category: input.category,
          notes: input.notes,
          completed: input.completed,
          reminderStatus: input.reminderStatus
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'UPDATE_ROUTINE',
          resourceType: 'RoutineItem',
          resourceId: id,
          metadata: { title: res.title }
        }
      });

      return res;
    });

    return this.formatRoutineItem(updated);
  }

  async completeRoutine(id: string, actorId?: string, completed?: boolean) {
    const existing = await routineRepository.findById(id);
    if (!existing) {
      throw new AppError('ROUTINE_NOT_FOUND', 'Routine item not found.', 404);
    }

    const nextCompleted = completed !== undefined ? completed : !existing.completed;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.routineItem.update({
        where: { id },
        data: { completed: nextCompleted }
      });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            patientId: existing.patientId,
            action: 'COMPLETE_ROUTINE',
            resourceType: 'RoutineItem',
            resourceId: id,
            metadata: { completed: nextCompleted }
          }
        });
      }

      return res;
    });

    return this.formatRoutineItem(updated);
  }

  async deleteRoutine(id: string, userId: string) {
    const existing = await routineRepository.findById(id);
    if (!existing) {
      throw new AppError('ROUTINE_NOT_FOUND', 'Routine item not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.routineItem.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'DELETE_ROUTINE',
          resourceType: 'RoutineItem',
          resourceId: id
        }
      });
    });

    return { id };
  }
}

export const routineService = new RoutineService();
