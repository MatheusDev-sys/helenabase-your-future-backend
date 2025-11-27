// HelenaBase Storage Service - Complete File Storage System

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  createdAt: string;
  fileCount: number;
  totalSize: number;
}

export interface StorageFile {
  id: string;
  name: string;
  bucketId: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
  versions: FileVersion[];
  thumbnail?: string;
}

export interface FileVersion {
  id: string;
  version: number;
  size: number;
  createdAt: string;
}

const STORAGE_KEY = 'helenabase_storage';

class StorageService {
  private buckets: StorageBucket[] = [];
  private files: StorageFile[] = [];

  constructor() {
    this.loadStorage();
    this.initializeDefaultBuckets();
  }

  private loadStorage(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      this.buckets = parsed.buckets || [];
      this.files = parsed.files || [];
    }
  }

  private saveStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      buckets: this.buckets,
      files: this.files,
    }));
  }

  private initializeDefaultBuckets(): void {
    if (this.buckets.length === 0) {
      this.createBucket('avatars', true);
      this.createBucket('documents', false);
      this.createBucket('images', true);
    }
  }

  // Create bucket
  createBucket(name: string, isPublic: boolean = false): StorageBucket {
    const bucket: StorageBucket = {
      id: `bucket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      public: isPublic,
      createdAt: new Date().toISOString(),
      fileCount: 0,
      totalSize: 0,
    };

    this.buckets.push(bucket);
    this.saveStorage();
    return bucket;
  }

  // Get all buckets
  getBuckets(): StorageBucket[] {
    return this.buckets;
  }

  // Get bucket by name
  getBucket(name: string): StorageBucket | null {
    return this.buckets.find(b => b.name === name) || null;
  }

  // Delete bucket
  deleteBucket(bucketId: string): boolean {
    const index = this.buckets.findIndex(b => b.id === bucketId);
    if (index === -1) return false;

    // Delete all files in bucket
    this.files = this.files.filter(f => f.bucketId !== bucketId);
    this.buckets.splice(index, 1);
    this.saveStorage();
    return true;
  }

  // Upload file (simulated)
  async uploadFile(bucketName: string, file: File, path: string = ''): Promise<StorageFile> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload

    const bucket = this.getBucket(bucketName);
    if (!bucket) {
      throw new Error('Bucket not found');
    }

    // Read file as base64 (for storage simulation)
    const base64 = await this.fileToBase64(file);

    const storageFile: StorageFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      bucketId: bucket.id,
      path: path ? `${path}/${file.name}` : file.name,
      size: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        uploadedBy: 'current_user',
        originalName: file.name,
      },
      versions: [{
        id: crypto.randomUUID(),
        version: 1,
        size: file.size,
        createdAt: new Date().toISOString(),
      }],
      thumbnail: file.type.startsWith('image/') ? base64 : undefined,
    };

    // Store file data separately to avoid bloating the main storage
    localStorage.setItem(`helenabase_file_${storageFile.id}`, base64);

    this.files.push(storageFile);
    bucket.fileCount++;
    bucket.totalSize += file.size;
    this.saveStorage();

    return storageFile;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Get files in bucket
  getFiles(bucketName: string, path: string = ''): StorageFile[] {
    const bucket = this.getBucket(bucketName);
    if (!bucket) return [];

    return this.files.filter(f => {
      if (f.bucketId !== bucket.id) return false;
      if (!path) return true;
      return f.path.startsWith(path);
    });
  }

  // Get file by id
  getFile(fileId: string): StorageFile | null {
    return this.files.find(f => f.id === fileId) || null;
  }

  // Download file (get base64 data)
  downloadFile(fileId: string): string | null {
    const file = this.getFile(fileId);
    if (!file) return null;

    return localStorage.getItem(`helenabase_file_${fileId}`);
  }

  // Delete file
  deleteFile(fileId: string): boolean {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) return false;

    const file = this.files[index];
    const bucket = this.buckets.find(b => b.id === file.bucketId);

    this.files.splice(index, 1);
    localStorage.removeItem(`helenabase_file_${fileId}`);

    if (bucket) {
      bucket.fileCount--;
      bucket.totalSize -= file.size;
    }

    this.saveStorage();
    return true;
  }

  // Get temporary signed URL (fake)
  getSignedUrl(fileId: string, expiresIn: number = 3600): string {
    const file = this.getFile(fileId);
    if (!file) return '';

    const token = btoa(`${fileId}:${Date.now() + expiresIn * 1000}`);
    return `https://storage.helenabase.com/${file.bucketId}/${file.path}?token=${token}`;
  }

  // Move file
  moveFile(fileId: string, newPath: string): boolean {
    const file = this.getFile(fileId);
    if (!file) return false;

    file.path = newPath;
    file.updatedAt = new Date().toISOString();
    this.saveStorage();
    return true;
  }

  // Copy file
  async copyFile(fileId: string, newBucketName: string, newPath: string): Promise<StorageFile | null> {
    const originalFile = this.getFile(fileId);
    if (!originalFile) return null;

    const newBucket = this.getBucket(newBucketName);
    if (!newBucket) return null;

    const fileData = this.downloadFile(fileId);
    if (!fileData) return null;

    const newFile: StorageFile = {
      ...originalFile,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bucketId: newBucket.id,
      path: newPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`helenabase_file_${newFile.id}`, fileData);
    this.files.push(newFile);
    newBucket.fileCount++;
    newBucket.totalSize += newFile.size;
    this.saveStorage();

    return newFile;
  }

  // Get storage stats
  getStorageStats() {
    const totalFiles = this.files.length;
    const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
    const bucketCount = this.buckets.length;

    return {
      totalFiles,
      totalSize,
      bucketCount,
      formattedSize: this.formatBytes(totalSize),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const storageService = new StorageService();
