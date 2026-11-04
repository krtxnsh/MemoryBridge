import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, StorageObjectInfo } from './storage.interface.js';
import { env } from '../../config/env.js';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private secret: string;

  constructor(baseDir: string = env.UPLOAD_DIR, secret: string = env.JWT_ACCESS_SECRET) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    this.secret = secret;

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private sign(action: 'upload' | 'read', filePath: string, expiresAt: number): string {
    const data = `${action}:${filePath}:${expiresAt}`;
    const sig = crypto.createHmac('sha256', this.secret).update(data).digest('hex');
    const payload = Buffer.from(JSON.stringify({ action, filePath, expiresAt, sig })).toString('base64url');
    return payload;
  }

  public verifyToken(token: string): { action: string; filePath: string; expiresAt: number } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      const { action, filePath, expiresAt, sig } = decoded;

      if (Date.now() > expiresAt) {
        throw new Error('Storage token expired');
      }

      const expectedSig = crypto.createHmac('sha256', this.secret).update(`${action}:${filePath}:${expiresAt}`).digest('hex');
      if (sig !== expectedSig) {
        throw new Error('Invalid storage token signature');
      }

      return { action, filePath, expiresAt };
    } catch (err: any) {
      throw new Error(`Invalid storage token: ${err.message}`);
    }
  }

  async generateUploadUrl(filePath: string, contentType: string, expiresInSec: number = 900): Promise<string> {
    const expiresAt = Date.now() + expiresInSec * 1000;
    const token = this.sign('upload', filePath, expiresAt);
    return `/api/v1/storage/upload?token=${token}`;
  }

  async generateReadUrl(filePath: string, expiresInSec: number = 900): Promise<string> {
    const expiresAt = Date.now() + expiresInSec * 1000;
    const token = this.sign('read', filePath, expiresAt);
    return `/api/v1/storage/file?token=${token}`;
  }

  async verifyObjectExists(filePath: string): Promise<StorageObjectInfo> {
    const fullPath = path.resolve(this.baseDir, filePath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false };
    }

    const stat = fs.statSync(fullPath);
    return {
      exists: true,
      sizeBytes: stat.size
    };
  }

  async deleteObject(filePath: string): Promise<void> {
    const fullPath = path.resolve(this.baseDir, filePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // ignore
      }
    }
  }

  public getDiskPath(filePath: string): string {
    const resolved = path.resolve(this.baseDir, filePath);
    // Path traversal check
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error('Directory traversal denied');
    }
    return resolved;
  }
}
