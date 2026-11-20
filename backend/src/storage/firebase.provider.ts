import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { StorageProvider, UploadTarget, ObjectStat, StorageObjectInfo } from './storage.interface';
import { env } from '../config/env';

export class FirebaseStorageProvider implements StorageProvider {
  private app: App;
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.bucketName = env.FIREBASE_STORAGE_BUCKET;

    if (getApps().length === 0) {
      this.app = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        storageBucket: this.bucketName
      });
    } else {
      this.app = getApp();
    }

    this.storage = getStorage(this.app);
  }

  private get bucket() {
    return this.storage.bucket(this.bucketName);
  }

  async createUploadTarget(params: {
    storagePath: string;
    contentType: string;
    maxSizeBytes: number;
    ttlSeconds: number;
  }): Promise<UploadTarget> {
    const expiresAt = new Date(Date.now() + params.ttlSeconds * 1000);
    const file = this.bucket.file(params.storagePath);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: params.contentType,
      extensionHeaders: {
        'x-goog-content-length-range': `0,${params.maxSizeBytes}`
      }
    });

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
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const file = this.bucket.file(storagePath);

    const [readUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt
    });

    return readUrl;
  }

  async statObject(storagePath: string): Promise<ObjectStat> {
    const file = this.bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
      return { exists: false, size: 0 };
    }

    const [metadata] = await file.getMetadata();
    const size = typeof metadata.size === 'number' ? metadata.size : parseInt(metadata.size || '0', 10);

    let md5: string | undefined;
    if (metadata.md5Hash) {
      md5 = Buffer.from(metadata.md5Hash, 'base64').toString('hex');
    }

    return {
      exists: true,
      size,
      contentType: metadata.contentType,
      md5
    };
  }

  async readRange(storagePath: string, start: number, end: number): Promise<Buffer> {
    const file = this.bucket.file(storagePath);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = file.createReadStream({ start, end });
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async deleteObject(storagePath: string): Promise<void> {
    const file = this.bucket.file(storagePath);
    try {
      await file.delete({ ignoreNotFound: true });
    } catch (err: any) {
      // 404 is acceptable
      if (err.code !== 404) {
        throw err;
      }
    }
  }

  async listObjects(prefix?: string): Promise<StorageObjectInfo[]> {
    const [files] = await this.bucket.getFiles({ prefix });
    return files.map((file) => {
      const size = typeof file.metadata.size === 'number' ? file.metadata.size : parseInt(file.metadata.size || '0', 10);
      const updatedAt = file.metadata.updated ? new Date(file.metadata.updated) : new Date();
      return {
        storagePath: file.name,
        size,
        updatedAt
      };
    });
  }
}

