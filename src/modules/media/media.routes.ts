import { Router, Request, Response } from 'express';
import { successResponse } from '../../common/response';
import { UnauthorizedException } from '../../common/exceptions';
import { authenticate } from '../../middleware/authentication.middleware';
import { uploadListingPhotos } from '../../middleware/upload.middleware';
import { uploadService } from '../../common/services/upload.service';
import { validate } from '../../common/validation/general.valodation';
import { reorderMediaSchema } from '../listing/listing.validation';
import { listingService } from '../listing/listing.service';

export const mediaRoutes = Router({ mergeParams: true });

const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

mediaRoutes.post('/', authenticate, uploadListingPhotos, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const files = (req.files || []) as Express.Multer.File[];
  const urls = files.map((file) => uploadService.toStoredUpload(file).url);
  const listing = await listingService.addMedia(param(req.params.id), req.user.userId, urls);
  return successResponse({ res, data: listing, message: 'Listing media uploaded successfully', status: 201 });
});

mediaRoutes.delete('/:mediaId', authenticate, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const listing = await listingService.deleteMedia(param(req.params.id), req.user.userId, param(req.params.mediaId));
  return successResponse({ res, data: listing, message: 'Listing media deleted successfully' });
});

mediaRoutes.put('/reorder', authenticate, validate(reorderMediaSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const listing = await listingService.reorderMedia(param(req.params.id), req.user.userId, req.body);
  return successResponse({ res, data: listing, message: 'Listing media reordered successfully' });
});
