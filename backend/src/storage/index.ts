import { env } from '../config/env';
import { StorageProvider } from './storage.interface';
import { MockStorageProvider } from './mock.provider';
import { LocalStorageProvider } from './local.provider';
import { FirebaseStorageProvider } from './firebase.provider';

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  // Tests default to MockStorageProvider unless explicitly overridden
  if (process.env.NODE_ENV === 'test' && !process.env.STORAGE_PROVIDER_FORCE) {
    storageInstance = new MockStorageProvider();
    return storageInstance;
  }

  switch (env.STORAGE_PROVIDER) {
    case 'firebase':
      storageInstance = new FirebaseStorageProvider();
      break;
    case 'local':
      storageInstance = new LocalStorageProvider();
      break;
    case 'mock':
    default:
      storageInstance = new MockStorageProvider();
      break;
  }

  return storageInstance;
}

export function setStorageProvider(provider: StorageProvider | null): void {
  storageInstance = provider;
}

export const storage: StorageProvider = {
  createUploadTarget: (...args) => getStorageProvider().createUploadTarget(...args),
  createReadUrl: (...args) => getStorageProvider().createReadUrl(...args),
  statObject: (...args) => getStorageProvider().statObject(...args),
  readRange: (...args) => getStorageProvider().readRange(...args),
  deleteObject: (...args) => getStorageProvider().deleteObject(...args),
  listObjects: (...args) => getStorageProvider().listObjects(...args)
};

export * from './storage.interface';
export * from './mock.provider';
export * from './local.provider';
export * from './firebase.provider';
