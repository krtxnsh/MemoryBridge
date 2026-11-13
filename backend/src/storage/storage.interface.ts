export interface UploadTarget {
  uploadUrl: string;
  method: 'PUT';
  requiredHeaders: Record<string, string>;
  expiresAt: Date;
}

export interface ObjectStat {
  exists: boolean;
  size: number;
  contentType?: string;
  md5?: string;
}

export interface StorageObjectInfo {
  storagePath: string;
  size: number;
  updatedAt: Date;
}

export interface StorageProvider {
  createUploadTarget(params: {
    storagePath: string;
    contentType: string;
    maxSizeBytes: number;
    ttlSeconds: number;
  }): Promise<UploadTarget>;

  createReadUrl(storagePath: string, ttlSeconds: number): Promise<string>;

  statObject(storagePath: string): Promise<ObjectStat>;

  readRange(storagePath: string, start: number, end: number): Promise<Buffer>;

  deleteObject(storagePath: string): Promise<void>;

  listObjects(prefix?: string): Promise<StorageObjectInfo[]>;
}

