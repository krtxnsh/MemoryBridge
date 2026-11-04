import admin from 'firebase-admin';
import { StorageProvider, StorageObjectInfo } from './storage.interface.js';
import { LocalStorageProvider } from './local.storage.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export class FirebaseStorageProvider implements StorageProvider {
  private fallback: LocalStorageProvider;
  private bucket: any;
  private isConfigured: boolean = false;

  constructor() {
    this.fallback = new LocalStorageProvider();

    if (
      env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY &&
      env.FIREBASE_STORAGE_BUCKET
    ) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: env.FIREBASE_PROJECT_ID,
              clientEmail: env.FIREBASE_CLIENT_EMAIL,
              privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            }),
            storageBucket: env.FIREBASE_STORAGE_BUCKET
          });
        }
        this.bucket = admin.storage().bucket();
        this.isConfigured = true;
        logger.info('Firebase Storage initialized successfully');
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to initialize Firebase Storage. Falling back to LocalStorageProvider.');
      }
    } else {
      logger.info('Firebase credentials not fully provided. Using LocalStorageProvider.');
    }
  }

  async generateUploadUrl(filePath: string, contentType: string, expiresInSec: number = 900): Promise<string> {
    if (!this.isConfigured) {
      return this.fallback.generateUploadUrl(filePath, contentType, expiresInSec);
    }

    const file = this.bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresInSec * 1000,
      contentType
    });

    return url;
  }

  async generateReadUrl(filePath: string, expiresInSec: number = 900): Promise<string> {
    if (!this.isConfigured) {
      return this.fallback.generateReadUrl(filePath, expiresInSec);
    }

    const file = this.bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSec * 1000
    });

    return url;
  }

  async verifyObjectExists(filePath: string): Promise<StorageObjectInfo> {
    if (!this.isConfigured) {
      return this.fallback.verifyObjectExists(filePath);
    }

    const file = this.bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return { exists: false };
    }

    const [metadata] = await file.getMetadata();
    return {
      exists: true,
      sizeBytes: Number(metadata.size),
      contentType: metadata.contentType
    };
  }

  async deleteObject(filePath: string): Promise<void> {
    if (!this.isConfigured) {
      return this.fallback.deleteObject(filePath);
    }

    const file = this.bucket.file(filePath);
    try {
      await file.delete();
    } catch {
      // ignore if already deleted
    }
  }
}
