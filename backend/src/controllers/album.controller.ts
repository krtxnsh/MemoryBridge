import { Request, Response } from 'express';
import { albumService } from '../services/album.service.js';
import {
  createAlbumSchema,
  updateAlbumSchema,
  listAlbumsQuerySchema
} from '../validators/album.validator.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class AlbumController {
  async listAlbums(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listAlbumsQuerySchema.parse(req.query);

    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await albumService.listAlbums(patientId, query, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async getAlbum(req: Request, res: Response): Promise<void> {
    const albumId = req.params.id as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await albumService.getAlbumById(albumId, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async createAlbum(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createAlbumSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await albumService.createAlbum(patientId, userId, input);
    sendCreated(res, result);
  }

  async updateAlbum(req: Request, res: Response): Promise<void> {
    const albumId = req.params.id as string;
    const input = updateAlbumSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await albumService.updateAlbum(albumId, userId, input);
    sendSuccess(res, result);
  }

  async deleteAlbum(req: Request, res: Response): Promise<void> {
    const albumId = req.params.id as string;
    const userId = req.user!.id;

    const result = await albumService.deleteAlbum(albumId, userId);
    sendSuccess(res, result);
  }
}

export const albumController = new AlbumController();
