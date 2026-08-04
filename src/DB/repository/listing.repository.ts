import { BaseRepository } from './base.repository';
import { ListingModel, IListing } from '../models/listing.model';

export class ListingRepository extends BaseRepository<IListing> {
  constructor() {
    super(ListingModel);
  }
}

export const listingRepository = new ListingRepository();
