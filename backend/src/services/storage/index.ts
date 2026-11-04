import { StorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './local.storage.js';
import { FirebaseStorageProvider } from './firebase.storage.js';
import { env } from '../../config/env.js';

export const localStorageProvider = new LocalStorageProvider();

export const storageProvider: StorageProvider =
  env.STORAGE_PROVIDER === 'firebase'
    ? new FirebaseStorageProvider()
    : localStorageProvider;

export * from './storage.interface.js';
export * from './local.storage.js';
