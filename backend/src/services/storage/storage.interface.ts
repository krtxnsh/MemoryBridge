export interface StorageObjectInfo {
  exists: boolean;
  sizeBytes?: number;
  contentType?: string;
}

export interface StorageProvider {
  generateUploadUrl(path: string, contentType: string, expiresInSec: number): Promise<string>;
  generateReadUrl(path: string, expiresInSec: number): Promise<string>;
  verifyObjectExists(path: string): Promise<StorageObjectInfo>;
  deleteObject(path: string): Promise<void>;
}
