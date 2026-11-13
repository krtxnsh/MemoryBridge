import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { LocalStorageProvider } from '../storage/local.provider';
import { sendError } from '../utils/response';

const router = Router();
const localProvider = new LocalStorageProvider();

// Helper middleware: disable route in production
const devOnly = (_req: Request, res: Response, next: () => void) => {
  if (env.NODE_ENV === 'production') {
    sendError(res, 'NOT_FOUND', 'Local storage endpoint is disabled in production', 404);
    return;
  }
  next();
};

// PUT /api/v1/storage/upload
router.put('/storage/upload', devOnly, async (req: Request, res: Response) => {
  const storagePath = req.query.path as string;
  const expiresStr = req.query.expires as string;
  const maxSizeStr = req.query.maxSize as string;
  const sig = req.query.sig as string;

  if (!storagePath || !expiresStr || !sig) {
    sendError(res, 'BAD_REQUEST', 'Missing required query parameters', 400);
    return;
  }

  const expires = parseInt(expiresStr, 10);
  const maxSize = maxSizeStr ? parseInt(maxSizeStr, 10) : undefined;

  if (isNaN(expires)) {
    sendError(res, 'BAD_REQUEST', 'Invalid expiration timestamp', 400);
    return;
  }

  const isValid = localProvider.verifySignature('upload', storagePath, expires, sig);
  if (!isValid) {
    sendError(res, 'FORBIDDEN', 'Invalid or expired upload signature', 403);
    return;
  }

  let fullPath: string;
  try {
    fullPath = localProvider.resolveLocalPath(storagePath);
  } catch (err: any) {
    sendError(res, 'BAD_REQUEST', err.message, 400);
    return;
  }

  // Ensure directory exists
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

  const writeStream = fs.createWriteStream(fullPath);
  let totalBytes = 0;
  let aborted = false;

  req.on('data', (chunk: Buffer) => {
    if (aborted) return;
    totalBytes += chunk.length;
    if (maxSize && totalBytes > maxSize) {
      aborted = true;
      req.pause();
      writeStream.destroy();
      fs.unlink(fullPath, () => {});
      sendError(res, 'FILE_TOO_LARGE', `Upload exceeded maximum size limit of ${maxSize} bytes`, 400);
    }
  });

  req.on('error', (err) => {
    if (!aborted) {
      writeStream.destroy();
      fs.unlink(fullPath, () => {});
      sendError(res, 'UPLOAD_ERROR', `Stream error: ${err.message}`, 500);
    }
  });

  writeStream.on('error', (err) => {
    if (!aborted) {
      fs.unlink(fullPath, () => {});
      sendError(res, 'UPLOAD_ERROR', `File write error: ${err.message}`, 500);
    }
  });

  writeStream.on('finish', () => {
    if (!aborted) {
      res.status(200).json({ data: { message: 'Upload completed successfully', size: totalBytes }, error: null });
    }
  });

  req.pipe(writeStream);
});

// GET /api/v1/storage/file
router.get('/storage/file', devOnly, async (req: Request, res: Response) => {
  const storagePath = req.query.path as string;
  const expiresStr = req.query.expires as string;
  const sig = req.query.sig as string;

  if (!storagePath || !expiresStr || !sig) {
    sendError(res, 'BAD_REQUEST', 'Missing required query parameters', 400);
    return;
  }

  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires)) {
    sendError(res, 'BAD_REQUEST', 'Invalid expiration timestamp', 400);
    return;
  }

  const isValid = localProvider.verifySignature('read', storagePath, expires, sig);
  if (!isValid) {
    sendError(res, 'FORBIDDEN', 'Invalid or expired read signature', 403);
    return;
  }

  let fullPath: string;
  try {
    fullPath = localProvider.resolveLocalPath(storagePath);
  } catch (err: any) {
    sendError(res, 'BAD_REQUEST', err.message, 400);
    return;
  }

  if (!fs.existsSync(fullPath)) {
    sendError(res, 'NOT_FOUND', 'File not found', 404);
    return;
  }

  res.sendFile(fullPath);
});

export default router;

