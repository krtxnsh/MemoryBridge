import { Prisma, RoutineItem } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class RoutineRepository {
  async findById(id: string): Promise<RoutineItem | null> {
    return prisma.routineItem.findUnique({
      where: { id }
    });
  }

  async findMany(params: {
    where: Prisma.RoutineItemWhereInput;
    orderBy: Prisma.RoutineItemOrderByWithRelationInput[];
    skip: number;
    take: number;
  }): Promise<RoutineItem[]> {
    return prisma.routineItem.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.RoutineItemWhereInput): Promise<number> {
    return prisma.routineItem.count({ where });
  }

  async create(data: Prisma.RoutineItemCreateInput): Promise<RoutineItem> {
    return prisma.routineItem.create({ data });
  }

  async update(id: string, data: Prisma.RoutineItemUpdateInput): Promise<RoutineItem> {
    return prisma.routineItem.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<RoutineItem> {
    return prisma.routineItem.delete({
      where: { id }
    });
  }
}

export const routineRepository = new RoutineRepository();

