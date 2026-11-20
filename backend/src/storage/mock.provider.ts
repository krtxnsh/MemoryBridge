import crypto from 'crypto';
import { StorageProvider, UploadTarget, ObjectStat, StorageObjectInfo } from './storage.interface';

interface StoredItem {
  buffer: Buffer;
  contentType: string;
  updatedAt: Date;
  md5: string;
}

export class MockStorageProvider implements StorageProvider {
  private storage = new Map<string, StoredItem>();
  private failureHook: 'upload' | 'read' | 'stat' | 'readRange' | 'delete' | null = null;

  setSimulateFailure(hook: 'upload' | 'read' | 'stat' | 'readRange' | 'delete' | null): void {
    this.failureHook = hook;
  }

  putObject(storagePath: string, buffer: Buffer, contentType: string): void {
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    this.storage.set(storagePath, {
      buffer,
      contentType,
      updatedAt: new Date(),
      md5
    });
  }

  getObject(storagePath: string): StoredItem | undefined {
    return this.storage.get(storagePath);
  }

  clear(): void {
    this.storage.clear();
    this.failureHook = null;
  }

  async createUploadTarget(params: {
    storagePath: string;
    contentType: string;
    maxSizeBytes: number;
    ttlSeconds: number;
  }): Promise<UploadTarget> {
    if (this.failureHook === 'upload') {
      throw new Error('Simulated storage upload target error');
    }

    const expiresAt = new Date(Date.now() + params.ttlSeconds * 1000);
    return {
      uploadUrl: `mock-upload://${params.storagePath}?expires=${expiresAt.getTime()}`,
      method: 'PUT',
      requiredHeaders: {
        'Content-Type': params.contentType
      },
      expiresAt
    };
  }

  async createReadUrl(storagePath: string, ttlSeconds: number): Promise<string> {
    if (this.failureHook === 'read') {
      throw new Error('Simulated storage read url error');
    }
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return `mock-read://${storagePath}?expires=${expiresAt.getTime()}`;
  }

  async statObject(storagePath: string): Promise<ObjectStat> {
    if (this.failureHook === 'stat') {
      throw new Error('Simulated storage stat error');
    }
    const item = this.storage.get(storagePath);
    if (!item) {
      return { exists: false, size: 0 };
    }
    return {
      exists: true,
      size: item.buffer.length,
      contentType: item.contentType,
      md5: item.md5
    };
  }

  async readRange(storagePath: string, start: number, end: number): Promise<Buffer> {
    if (this.failureHook === 'readRange') {
      throw new Error('Simulated storage readRange error');
    }
    const item = this.storage.get(storagePath);
    if (!item) {
      throw new Error(`Object not found: ${storagePath}`);
    }
    return item.buffer.subarray(start, end + 1);
  }

  async deleteObject(storagePath: string): Promise<void> {
    if (this.failureHook === 'delete') {
      throw new Error('Simulated storage delete error');
    }
    this.storage.delete(storagePath);
  }

  async listObjects(prefix?: string): Promise<StorageObjectInfo[]> {
    const results: StorageObjectInfo[] = [];
    for (const [path, item] of this.storage.entries()) {
      if (!prefix || path.startsWith(prefix)) {
        results.push({
          storagePath: path,
          size: item.buffer.length,
          updatedAt: item.updatedAt
        });
      }
    }
    return results;
  }
}

