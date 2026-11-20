import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, UploadTarget, ObjectStat, StorageObjectInfo } from './storage.interface';
import { env } from '../config/env';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private signingSecret: string;

  constructor(baseDir?: string, signingSecret?: string) {
    this.baseDir = path.resolve(baseDir || env.UPLOAD_DIR || './uploads');
    this.signingSecret = signingSecret || env.STORAGE_SIGNING_SECRET || env.JWT_ACCESS_SECRET;

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  resolveLocalPath(storagePath: string): string {
    const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(this.baseDir, normalized);
    const relative = path.relative(this.baseDir, fullPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Path traversal detected: ${storagePath}`);
    }

    return fullPath;
  }

  signToken(action: 'upload' | 'read', storagePath: string, expiresAt: number): string {
    const payload = `${action}:${storagePath}:${expiresAt}`;
    return crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
  }

  verifySignature(action: 'upload' | 'read', storagePath: string, expires: number, signature: string): boolean {
    if (Date.now() > expires) {
      return false;
    }
    const expected = this.signToken(action, storagePath, expires);
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  }

  async createUploadTarget(params: {
    storagePath: string;
    contentType: string;
    maxSizeBytes: number;
    ttlSeconds: number;
  }): Promise<UploadTarget> {
    const expiresAt = new Date(Date.now() + params.ttlSeconds * 1000);
    const expiresTs = expiresAt.getTime();
    const sig = this.signToken('upload', params.storagePath, expiresTs);

    const queryParams = new URLSearchParams({
      path: params.storagePath,
      expires: expiresTs.toString(),
      maxSize: params.maxSizeBytes.toString(),
      sig
    });

    const uploadUrl = `/api/v1/storage/upload?${queryParams.toString()}`;

    return {
      uploadUrl,
      method: 'PUT',
      requiredHeaders: {
        'Content-Type': params.contentType
      },
      expiresAt
    };
  }

  async createReadUrl(storagePath: string, ttlSeconds: number): Promise<string> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const sig = this.signToken('read', storagePath, expiresAt);
    const queryParams = new URLSearchParams({
      path: storagePath,
      expires: expiresAt.toString(),
      sig
    });

    return `/api/v1/storage/file?${queryParams.toString()}`;
  }

  async statObject(storagePath: string): Promise<ObjectStat> {
    const fullPath = this.resolveLocalPath(storagePath);
    try {
      const stats = await fs.promises.stat(fullPath);
      if (!stats.isFile()) {
        return { exists: false, size: 0 };
      }

      // Compute MD5
      const content = await fs.promises.readFile(fullPath);
      const md5 = crypto.createHash('md5').update(content).digest('hex');

      return {
        exists: true,
        size: stats.size,
        md5
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return { exists: false, size: 0 };
      }
      throw err;
    }
  }

  async readRange(storagePath: string, start: number, end: number): Promise<Buffer> {
    const fullPath = this.resolveLocalPath(storagePath);
    const length = end - start + 1;
    const buffer = Buffer.alloc(length);

    const fd = await fs.promises.open(fullPath, 'r');
    try {
      const { bytesRead } = await fd.read(buffer, 0, length, start);
      return buffer.subarray(0, bytesRead);
    } finally {
      await fd.close();
    }
  }

  async deleteObject(storagePath: string): Promise<void> {
    const fullPath = this.resolveLocalPath(storagePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async listObjects(prefix?: string): Promise<StorageObjectInfo[]> {
    const results: StorageObjectInfo[] = [];

    const traverse = async (currentDir: string) => {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          const relPath = path.relative(this.baseDir, fullPath).replace(/\\/g, '/');
          if (!prefix || relPath.startsWith(prefix)) {
            const stat = await fs.promises.stat(fullPath);
            results.push({
              storagePath: relPath,
              size: stat.size,
              updatedAt: stat.mtime
            });
          }
        }
      }
    };

    if (fs.existsSync(this.baseDir)) {
      await traverse(this.baseDir);
    }

    return results;
  }
}

