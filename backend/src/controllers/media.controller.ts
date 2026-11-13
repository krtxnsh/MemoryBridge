import { Request, Response } from 'express';
import { mediaService } from '../services/media.service';
import { sendSuccess } from '../utils/response';
import {
  createUploadUrlSchema,
  confirmUploadSchema,
  updateMediaSchema,
  listMediaQuerySchema
} from '../validators/media.validator';

export class MediaController {
  async createUploadUrl(req: Request, res: Response): Promise<void> {
    const input = createUploadUrlSchema.parse(req.body);
    const result = await mediaService.createUploadUrl(
      req.params.patientId as string,
      req.user!.id,
      req.patientAccess?.accessRole,
      !!req.patientSession,
      input
    );
    sendSuccess(res, result, 201);
  }

  async confirmUpload(req: Request, res: Response): Promise<void> {
    const input = confirmUploadSchema.parse(req.body);
    const result = await mediaService.confirmUpload(
      req.params.patientId as string,
      req.user!.id,
      req.patientAccess?.accessRole,
      !!req.patientSession,
      input
    );
    sendSuccess(res, result, 201);
  }

  async listMedia(req: Request, res: Response): Promise<void> {
    const query = listMediaQuerySchema.parse(req.query);
    const result = await mediaService.listMedia(
      req.params.patientId as string,
      req.user?.id,
      req.patientAccess?.accessRole,
      !!req.patientSession,
      query
    );
    sendSuccess(res, result, 200);
  }

  async getMediaUrl(req: Request, res: Response): Promise<void> {
    const result = await mediaService.getMediaUrl(
      req.params.id as string,
      req.user?.id,
      req.patientAccess?.accessRole,
      !!req.patientSession
    );
    sendSuccess(res, result, 200);
  }

  async updateMedia(req: Request, res: Response): Promise<void> {
    const input = updateMediaSchema.parse(req.body);
    const result = await mediaService.updateMedia(
      req.params.id as string,
      req.user!.id,
      req.patientAccess?.accessRole,
      !!req.patientSession,
      input
    );
    sendSuccess(res, result, 200);
  }

  async deleteMedia(req: Request, res: Response): Promise<void> {
    const result = await mediaService.deleteMedia(
      req.params.id as string,
      req.user!.id,
      req.patientAccess?.accessRole,
      !!req.patientSession
    );
    sendSuccess(res, result, 200);
  }

  async listMemoryMedia(req: Request, res: Response): Promise<void> {
    const result = await mediaService.listMemoryMedia(
      req.params.memoryId as string,
      req.user?.id,
      req.patientAccess?.accessRole,
      !!req.patientSession
    );
    sendSuccess(res, result, 200);
  }
}

export const mediaController = new MediaController();
