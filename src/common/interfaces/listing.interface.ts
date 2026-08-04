import { Types } from 'mongoose';
import { ListingAmenity, ListingCategory, ListingCurrency, ListingStatus, MediaType } from '../enums';

export interface IListingMedia {
  _id?: Types.ObjectId;
  mediaType: MediaType;
  url: string;
  sortOrder: number;
}

export interface IListing {
  _id: Types.ObjectId;
  landlordId: Types.ObjectId;
  title: string;
  category: ListingCategory;
  areaSqm: number;
  city: string;
  district: string;
  address: string;
  description: string;
  amenities: ListingAmenity[];
  numberOfFloors?: number;
  floorNumber?: number;
  availableFrom?: Date;
  minimumLeaseTerm?: string;
  annualRent: number;
  currency: ListingCurrency;
  securityDepositMonths: number;
  status: ListingStatus;
  media: IListingMedia[];
  createdAt?: Date;
  updatedAt?: Date;
}
