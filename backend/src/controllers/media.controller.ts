import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { mediaService } from '../services/media.service.js';
import { localStorageProvider } from '../services/storage/index.js';
import { requestUploadUrlSchema, confirmUploadSchema } from '../validators/media.validator.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MediaController {
  async requestUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const validated = requestUploadUrlSchema.parse(req.body);

      const result = await mediaService.requestUploadUrl(
        patientId,
        validated.mimeType,
        validated.sizeBytes,
        validated.fileName
      );

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async confirmUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const validated = confirmUploadSchema.parse(req.body);

      const media = await mediaService.confirmUpload(
        patientId,
        userId,
        validated.storagePath,
        validated.fileName,
        validated.mimeType,
        validated.sizeBytes,
        validated.memoryId || undefined,
        validated.caption
      );

      sendSuccess(res, media, 201);
    } catch (err) {
      next(err);
    }
  }

  async getMediaUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await mediaService.getMediaUrl(id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listMediaForMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memoryId = req.params.memoryId as string;
      const mediaList = await mediaService.listMediaForMemory(memoryId);
      sendSuccess(res, mediaList);
    } catch (err) {
      next(err);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const userId = req.user!.id;

      await mediaService.deleteMedia(id, userId, patientId);
      sendSuccess(res, { id, message: 'Media deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Local storage handlers for dev & offline testing
  async handleLocalUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        sendError(res, 'MISSING_TOKEN', 'Storage token is required', 400);
        return;
      }

      const { action, filePath } = localStorageProvider.verifyToken(token);
      if (action !== 'upload') {
        sendError(res, 'FORBIDDEN', 'Token not authorized for upload', 403);
        return;
      }

      const diskPath = localStorageProvider.getDiskPath(filePath);
      const parentDir = path.dirname(diskPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(diskPath);
      req.pipe(writeStream);

      writeStream.on('finish', () => {
        sendSuccess(res, { message: 'File uploaded successfully' });
      });

      writeStream.on('error', (err) => {
        next(err);
      });
    } catch (err) {
      next(err);
    }
  }

  async handleLocalDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        sendError(res, 'MISSING_TOKEN', 'Storage token is required', 400);
        return;
      }

      const { action, filePath } = localStorageProvider.verifyToken(token);
      if (action !== 'read') {
        sendError(res, 'FORBIDDEN', 'Token not authorized for read', 403);
        return;
      }

      const diskPath = localStorageProvider.getDiskPath(filePath);
      if (!fs.existsSync(diskPath)) {
        sendError(res, 'FILE_NOT_FOUND', 'File not found', 404);
        return;
      }

      res.sendFile(diskPath);
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();
