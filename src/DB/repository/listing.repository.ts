import { BaseRepository } from './base.repository';
import { ListingModel, IListing } from '../models/listing.model';
import { FilterQuery } from 'mongoose';

export class ListingRepository extends BaseRepository<IListing> {
  constructor() {
    super(ListingModel);
  }

  async findWithPagination(
    filter: FilterQuery<IListing>,
    sort: Record<string, 1 | -1>,
    skip: number,
    limit: number
  ) {
    const [items, total] = await Promise.all([
      ListingModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      ListingModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }
}

export const listingRepository = new ListingRepository();
