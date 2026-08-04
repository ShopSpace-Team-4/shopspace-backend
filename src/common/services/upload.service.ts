import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { Request } from 'express';
import multer from 'multer';
import { BadRequestException } from '../exceptions';

export interface StoredUpload {
  url: string;
}

class LocalUploadService {
  private readonly uploadRoot = join(process.cwd(), 'uploads', 'listings');

  constructor() {
    mkdirSync(this.uploadRoot, { recursive: true });
  }

  getStorage(): multer.StorageEngine {
    return multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, this.uploadRoot),
      filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  toStoredUpload(file: Express.Multer.File): StoredUpload {
    return { url: `/uploads/listings/${file.filename}` };
  }
}

export const uploadService = new LocalUploadService();

export const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new BadRequestException('Only PNG and JPG images are allowed'));
};
