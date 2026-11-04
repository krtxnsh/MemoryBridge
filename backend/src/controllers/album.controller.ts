import { Request, Response, NextFunction } from 'express';
import { albumService } from '../services/album.service.js';
import {
  createAlbumSchema,
  updateAlbumSchema,
  createStorybookSchema,
  reorderStorybookMemoriesSchema
} from '../validators/core.validator.js';
import { sendSuccess } from '../utils/response.js';

export class AlbumController {
  async listAlbums(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const albums = await albumService.listAlbums(patientId);
      sendSuccess(res, albums);
    } catch (err) {
      next(err);
    }
  }

  async createAlbum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const validated = createAlbumSchema.parse(req.body);
      const album = await albumService.createAlbum(patientId, validated);
      sendSuccess(res, album, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateAlbum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = updateAlbumSchema.parse(req.body);
      const album = await albumService.updateAlbum(id, validated);
      sendSuccess(res, album);
    } catch (err) {
      next(err);
    }
  }

  async deleteAlbum(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await albumService.deleteAlbum(id);
      sendSuccess(res, { id, message: 'Album deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async listStorybooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const storybooks = await albumService.listStorybooks(patientId);
      sendSuccess(res, storybooks);
    } catch (err) {
      next(err);
    }
  }

  async createStorybook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const validated = createStorybookSchema.parse(req.body);

      const storybook = await albumService.createStorybook(patientId, userId, validated);
      sendSuccess(res, storybook, 201);
    } catch (err) {
      next(err);
    }
  }

  async reorderStorybookMemories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { memoryIds } = reorderStorybookMemoriesSchema.parse(req.body);

      const updated = await albumService.reorderStorybookMemories(id, memoryIds);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}

export const albumController = new AlbumController();
