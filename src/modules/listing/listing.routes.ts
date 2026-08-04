import { Router, Request, Response } from 'express';
import { successResponse } from '../../common/response';
import { UnauthorizedException } from '../../common/exceptions';
import { authenticate, optionalAuthenticate } from '../../middleware/authentication.middleware';
import { validate } from '../../common/validation/general.valodation';
import { listingPayloadSchema, updateListingSchema, updateListingStatusSchema } from './listing.validation';
import { listingService } from './listing.service';
import { ListingAmenity, ListingCategory, ListingStatus } from '../../common/enums';

export const listingRoutes = Router();

const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

listingRoutes.post('/', authenticate, validate(listingPayloadSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await listingService.assertLandlord(req.user.userId);
  const listing = await listingService.create(req.user.userId, req.body);
  return successResponse({ res, data: listing, message: 'Listing created successfully', status: 201 });
});

listingRoutes.get('/', optionalAuthenticate, async (req: Request, res: Response) => {
  const listings = await listingService.list(req.query as Record<string, string | string[] | undefined>, req.user?.userId);
  return successResponse({ res, data: listings });
});

listingRoutes.get('/meta', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      categories: Object.values(ListingCategory),
      amenities: Object.values(ListingAmenity),
      statuses: Object.values(ListingStatus),
    },
  });
});

listingRoutes.get('/my-listings', authenticate, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await listingService.assertLandlord(req.user.userId);
  const listings = await listingService.getMyListings(req.user.userId);
  return successResponse({ res, data: listings });
});

listingRoutes.get('/:id', optionalAuthenticate, async (req: Request, res: Response) => {
  const listing = await listingService.getById(param(req.params.id), req.user?.userId);
  return successResponse({ res, data: listing });
});

listingRoutes.put('/:id', authenticate, validate(updateListingSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const listing = await listingService.update(param(req.params.id), req.user.userId, req.body);
  return successResponse({ res, data: listing, message: 'Listing updated successfully' });
});

listingRoutes.delete('/:id', authenticate, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await listingService.delete(param(req.params.id), req.user.userId);
  return successResponse({ res, message: 'Listing deleted successfully' });
});

listingRoutes.patch('/:id/status', authenticate, validate(updateListingStatusSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const listing = await listingService.updateStatus(param(req.params.id), req.user.userId, req.body);
  return successResponse({ res, data: listing, message: 'Listing status updated successfully' });
});

listingRoutes.post('/:id/save', authenticate, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await listingService.saveListing(param(req.params.id), req.user.userId);
  return successResponse({ res, message: 'Listing saved successfully' });
});

listingRoutes.delete('/:id/save', authenticate, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await listingService.unsaveListing(param(req.params.id), req.user.userId);
  return successResponse({ res, message: 'Listing removed from saved listings' });
});
