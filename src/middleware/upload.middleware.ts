import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { BadRequestException } from '../common/exceptions';
import { imageFileFilter, uploadService } from '../common/services/upload.service';

const listingPhotoUpload = multer({
  storage: uploadService.getStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).array('photos');

export const uploadListingPhotos = (req: Request, res: Response, next: NextFunction) => {
  listingPhotoUpload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      return next(new BadRequestException(error.message, error));
    }
    return next(error);
  });
};
