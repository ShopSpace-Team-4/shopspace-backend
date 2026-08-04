import { z } from 'zod';
import { ListingAmenity, ListingCategory, ListingCurrency, ListingStatus } from '../../common/enums';

const numberField = (field: string) => z.coerce.number({ error: `${field} is mandatory` }).nonnegative();

export const listingPayloadSchema = z.object({
  title: z.string({ error: 'title is mandatory' }).min(1),
  category: z.enum(Object.values(ListingCategory) as [ListingCategory, ...ListingCategory[]], { error: 'invalid category' }),
  areaSqm: numberField('areaSqm'),
  city: z.string({ error: 'city is mandatory' }).min(1),
  district: z.string({ error: 'district is mandatory' }).min(1),
  address: z.string({ error: 'address is mandatory' }).min(1),
  description: z.string({ error: 'description is mandatory' }).min(1),
  amenities: z.array(z.enum(Object.values(ListingAmenity) as [ListingAmenity, ...ListingAmenity[]])).default([]),
  numberOfFloors: z.coerce.number().nonnegative().optional(),
  floorNumber: z.coerce.number().nonnegative().optional(),
  availableFrom: z.coerce.date().optional(),
  minimumLeaseTerm: z.string().optional(),
  annualRent: numberField('annualRent'),
  currency: z.enum(Object.values(ListingCurrency) as [ListingCurrency, ...ListingCurrency[]]).default(ListingCurrency.EGP),
  securityDepositMonths: numberField('securityDepositMonths'),
});

export const updateListingSchema = listingPayloadSchema.partial().refine((data) => Object.keys(data).length > 0, {
  error: 'At least one field must be provided',
});

export const updateListingStatusSchema = z.object({
  status: z.enum(Object.values(ListingStatus) as [ListingStatus, ...ListingStatus[]], { error: 'invalid status' }),
});

export const reorderMediaSchema = z.object({
  media: z.array(z.object({
    mediaId: z.string({ error: 'mediaId is mandatory' }),
    sortOrder: z.coerce.number({ error: 'sortOrder is mandatory' }).nonnegative(),
  })).min(1),
});
