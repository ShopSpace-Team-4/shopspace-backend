import { z } from 'zod';
import { listingPayloadSchema, reorderMediaSchema, updateListingSchema, updateListingStatusSchema } from './listing.validation';

export type CreateListingDto = z.infer<typeof listingPayloadSchema>;
export type UpdateListingDto = z.infer<typeof updateListingSchema>;
export type UpdateListingStatusDto = z.infer<typeof updateListingStatusSchema>;
export type ReorderMediaDto = z.infer<typeof reorderMediaSchema>;
