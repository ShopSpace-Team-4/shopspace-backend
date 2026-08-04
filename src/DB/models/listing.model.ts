import { Schema, model, models } from 'mongoose';
import { IListing } from '../../common/interfaces/listing.interface';
import { ListingAmenity, ListingCategory, ListingCurrency, ListingStatus, MediaType } from '../../common/enums';

export { IListing };

const listingMediaSchema = new Schema(
  {
    mediaType: { type: String, enum: Object.values(MediaType), required: true },
    url: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const listingSchema = new Schema<IListing>(
  {
    landlordId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: Object.values(ListingCategory), required: true },
    areaSqm: { type: Number, required: true, min: 0 },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amenities: [{ type: String, enum: Object.values(ListingAmenity) }],
    numberOfFloors: { type: Number, min: 0 },
    floorNumber: { type: Number, min: 0 },
    availableFrom: { type: Date },
    minimumLeaseTerm: { type: String, trim: true },
    annualRent: { type: Number, required: true, index: true, min: 0 },
    currency: { type: String, enum: Object.values(ListingCurrency), default: ListingCurrency.EGP },
    securityDepositMonths: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(ListingStatus), default: ListingStatus.PENDING },
    media: { type: [listingMediaSchema], default: [] },
  },
  { timestamps: true }
);

listingSchema.index({ city: 1, district: 1, category: 1, status: 1 });

export const ListingModel = models.Listing || model<IListing>('Listing', listingSchema);
