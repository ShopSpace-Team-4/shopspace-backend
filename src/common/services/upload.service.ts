import { Readable } from 'node:stream';
import { v2 as cloudinarySdk, UploadApiResponse } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { BadRequestException } from '../exceptions';
import { cloudinary } from '../../config/config';

export interface StoredUpload {
  url: string;
  publicId: string;
}

class CloudinaryUploadService {
  constructor() {
    cloudinarySdk.config({
      cloud_name: cloudinary.cloudName,
      api_key: cloudinary.apiKey,
      api_secret: cloudinary.apiSecret,
    });
  }

  getStorage(): multer.StorageEngine {
    return multer.memoryStorage();
  }

  async toStoredUpload(file: Express.Multer.File, listingId: string): Promise<StoredUpload> {
    if (!file.buffer) throw new BadRequestException('Upload file buffer is missing');
    const result = await this.uploadBuffer(file.buffer, `shopspace/listings/${listingId}`);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async delete(publicId: string) {
    await cloudinarySdk.uploader.destroy(publicId);
  }

  private uploadBuffer(buffer: Buffer, folder: string) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinarySdk.uploader.upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload did not return a result'));
        return resolve(result);
      });

      Readable.from(buffer).pipe(uploadStream);
    });
  }
}

export const uploadService = new CloudinaryUploadService();

export const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new BadRequestException('Only PNG and JPG images are allowed'));
};
