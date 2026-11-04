import { RoutinePeriod, RoutineCategory } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateRoutineItemInput {
  title: string;
  scheduledTime: string;
  period: RoutinePeriod;
  category: RoutineCategory;
  notes?: string;
}

export class RoutineService {
  async listRoutineItems(patientId: string) {
    return prisma.routineItem.findMany({
      where: { patientId },
      orderBy: [
        { period: 'asc' },
        { scheduledTime: 'asc' }
      ]
    });
  }

  async createRoutineItem(patientId: string, userId: string, input: CreateRoutineItemInput) {
    return prisma.routineItem.create({
      data: {
        patientId,
        createdBy: userId,
        title: input.title,
        scheduledTime: input.scheduledTime,
        period: input.period,
        category: input.category,
        notes: input.notes || null,
        completed: false
      }
    });
  }

  async toggleComplete(id: string, completed?: boolean) {
    const item = await prisma.routineItem.findUnique({
      where: { id }
    });

    if (!item) {
      throw new AppError('ROUTINE_ITEM_NOT_FOUND', 'Routine item not found', 404);
    }

    const nextCompleted = completed !== undefined ? completed : !item.completed;

    return prisma.routineItem.update({
      where: { id },
      data: { completed: nextCompleted }
    });
  }

  async deleteRoutineItem(id: string) {
    return prisma.routineItem.delete({
      where: { id }
    });
  }
}

export const routineService = new RoutineService();
