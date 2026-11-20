import { Prisma, Album } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class AlbumRepository {
  async findById(id: string): Promise<Album | null> {
    return prisma.album.findUnique({
      where: { id }
    });
  }

  async findMany(params: {
    where: Prisma.AlbumWhereInput;
    orderBy: Prisma.AlbumOrderByWithRelationInput[];
    skip: number;
    take: number;
  }): Promise<Album[]> {
    return prisma.album.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.AlbumWhereInput): Promise<number> {
    return prisma.album.count({ where });
  }

  async create(data: Prisma.AlbumCreateInput): Promise<Album> {
    return prisma.album.create({ data });
  }

  async update(id: string, data: Prisma.AlbumUpdateInput): Promise<Album> {
    return prisma.album.update({
      where: { id },
      data
    });
  }

  async deleteAndDisassociate(id: string): Promise<Album> {
    return prisma.$transaction(async (tx) => {
      // Disassociate all memories referencing this album
      await tx.memory.updateMany({
        where: { albumId: id },
        data: { albumId: null }
      });

      return tx.album.delete({
        where: { id }
      });
    });
  }
}

export const albumRepository = new AlbumRepository();

