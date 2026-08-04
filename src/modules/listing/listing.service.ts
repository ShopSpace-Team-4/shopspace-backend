import { FilterQuery, Types } from 'mongoose';
import { listingRepository } from '../../DB/repository/listing.repository';
import { userRepository } from '../../DB/repository/user.repository';
import { IListing, IListingMedia } from '../../common/interfaces/listing.interface';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../common/exceptions';
import { ListingAmenity, ListingStatus, MediaType, Role } from '../../common/enums';
import { CreateListingDto, ReorderMediaDto, UpdateListingDto, UpdateListingStatusDto } from './listing.dto';

type ListingQuery = Record<string, string | string[] | undefined>;

class ListingService {
  async create(landlordId: string, dto: CreateListingDto) {
    const listing = await listingRepository.create({
      ...dto,
      landlordId: new Types.ObjectId(landlordId),
      status: ListingStatus.PENDING,
    });
    return this.toListingResponse(listing, landlordId);
  }

  async list(query: ListingQuery, userId?: string) {
    const filter = this.buildFilter(query);
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const sort = this.buildSort(typeof query.sort === 'string' ? query.sort : undefined);
    const listings = await listingRepository.find(filter);
    const savedIds = await this.getSavedListingIds(userId);
    const sorted = listings.sort((a, b) => this.compareListings(a, b, sort));
    const paged = sorted.slice((page - 1) * limit, page * limit);

    return {
      items: paged.map((listing) => this.toListingResponse(listing, userId, savedIds)),
      meta: {
        page,
        limit,
        total: listings.length,
        pages: Math.ceil(listings.length / limit),
      },
    };
  }

  async getById(id: string, userId?: string) {
    const listing = await this.findListing(id);
    const savedIds = await this.getSavedListingIds(userId);
    return this.toListingResponse(listing, userId, savedIds);
  }

  async getMyListings(landlordId: string) {
    const listings = await listingRepository.find({ landlordId: new Types.ObjectId(landlordId) });
    return listings.map((listing) => ({
      id: listing._id.toString(),
      title: listing.title,
      category: listing.category,
      areaSqm: listing.areaSqm,
      annualRent: listing.annualRent,
      currency: listing.currency,
      status: listing.status,
      thumbnailUrl: this.getThumbnailUrl(listing.media),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    }));
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.findOwnedListing(id, userId);
    const updated = await listingRepository.updateById(listing._id, dto);
    if (!updated) throw new NotFoundException('Listing');
    return this.toListingResponse(updated, userId);
  }

  async delete(id: string, userId: string) {
    const listing = await this.findOwnedListing(id, userId);
    await listingRepository.deleteById(listing._id);
  }

  async updateStatus(id: string, userId: string, dto: UpdateListingStatusDto) {
    const listing = await this.findOwnedListing(id, userId);
    const updated = await listingRepository.updateById(listing._id, { status: dto.status });
    if (!updated) throw new NotFoundException('Listing');
    return this.toListingResponse(updated, userId);
  }

  async addMedia(id: string, userId: string, urls: string[]) {
    const listing = await this.findOwnedListing(id, userId);
    const media = [
      ...listing.media,
      ...urls.map((url, index) => ({
        mediaType: MediaType.IMAGE,
        url,
        sortOrder: listing.media.length + index,
      })),
    ];
    const updated = await listingRepository.updateById(listing._id, { media });
    if (!updated) throw new NotFoundException('Listing');
    return this.toListingResponse(updated, userId);
  }

  async deleteMedia(id: string, userId: string, mediaId: string) {
    const listing = await this.findOwnedListing(id, userId);
    const media = listing.media.filter((item) => item._id?.toString() !== mediaId);
    const updated = await listingRepository.updateById(listing._id, { media });
    if (!updated) throw new NotFoundException('Listing');
    return this.toListingResponse(updated, userId);
  }

  async reorderMedia(id: string, userId: string, dto: ReorderMediaDto) {
    const listing = await this.findOwnedListing(id, userId);
    const orderMap = new Map(dto.media.map((item) => [item.mediaId, item.sortOrder]));
    const media = listing.media.map((item) => ({
      ...item,
      sortOrder: orderMap.get(item._id?.toString() || '') ?? item.sortOrder,
    }));
    const updated = await listingRepository.updateById(listing._id, { media });
    if (!updated) throw new NotFoundException('Listing');
    return this.toListingResponse(updated, userId);
  }

  async saveListing(id: string, userId: string) {
    await this.findListing(id);
    await userRepository.updateById(userId, { $addToSet: { savedListings: new Types.ObjectId(id) } });
  }

  async unsaveListing(id: string, userId: string) {
    await userRepository.updateById(userId, { $pull: { savedListings: new Types.ObjectId(id) } });
  }

  async getSavedListings(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User');
    const savedIds = new Set((user.savedListings || []).map((id) => id.toString()));
    if (!savedIds.size) return [];
    const listings = await listingRepository.find({ _id: { $in: [...savedIds].map((id) => new Types.ObjectId(id)) } });

    return listings.map((listing) => ({
      id: listing._id.toString(),
      title: listing.title,
      location: `${listing.district}, ${listing.city}`,
      annualRent: listing.annualRent,
      annualRentWithVat: this.withVat(listing.annualRent),
      currency: listing.currency,
      areaSqm: listing.areaSqm,
      thumbnailUrl: this.getThumbnailUrl(listing.media),
      isSaved: true,
    }));
  }

  async assertLandlord(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundException('User');
    if (!user.roles?.includes(Role.LANDLORD)) {
      throw new ForbiddenException('Only landlords can manage listings');
    }
  }

  private async findListing(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid listing id');
    const listing = await listingRepository.findById(id);
    if (!listing) throw new NotFoundException('Listing');
    return listing;
  }

  private async findOwnedListing(id: string, userId: string) {
    const listing = await this.findListing(id);
    if (listing.landlordId.toString() !== userId) {
      throw new ForbiddenException('Only the listing owner can perform this action');
    }
    return listing;
  }

  private async getSavedListingIds(userId?: string) {
    if (!userId) return new Set<string>();
    const user = await userRepository.findById(userId);
    return new Set((user?.savedListings || []).map((id) => id.toString()));
  }

  private buildFilter(query: ListingQuery): FilterQuery<IListing> {
    const filter: FilterQuery<IListing> = {};
    if (query.city) filter.city = query.city;
    if (query.district) filter.district = query.district;
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.priceMin || query.priceMax) filter.annualRent = this.range(query.priceMin, query.priceMax);
    if (query.areaMin || query.areaMax) filter.areaSqm = this.range(query.areaMin, query.areaMax);
    if (query.amenities) {
      const amenities = Array.isArray(query.amenities) ? query.amenities : query.amenities.split(',');
      filter.amenities = { $all: amenities as ListingAmenity[] };
    }
    return filter;
  }

  private range(min?: string | string[], max?: string | string[]) {
    const query: { $gte?: number; $lte?: number } = {};
    if (typeof min === 'string') query.$gte = Number(min);
    if (typeof max === 'string') query.$lte = Number(max);
    return query;
  }

  private buildSort(sort?: string) {
    const [field = 'createdAt', direction = 'desc'] = (sort || '').split(':');
    return { field, direction: direction === 'asc' ? 1 : -1 };
  }

  private compareListings(a: IListing, b: IListing, sort: { field: string; direction: number }) {
    const aValue = a[sort.field as keyof IListing] as string | number | Date | undefined;
    const bValue = b[sort.field as keyof IListing] as string | number | Date | undefined;
    if (aValue === bValue) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    return aValue > bValue ? sort.direction : -sort.direction;
  }

  private toListingResponse(listing: IListing, userId?: string, savedIds = new Set<string>()) {
    const sortedMedia = [...listing.media].sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      id: listing._id.toString(),
      landlordId: listing.landlordId.toString(),
      title: listing.title,
      category: listing.category,
      areaSqm: listing.areaSqm,
      city: listing.city,
      district: listing.district,
      address: listing.address,
      description: listing.description,
      amenities: listing.amenities,
      numberOfFloors: listing.numberOfFloors,
      floorNumber: listing.floorNumber,
      availableFrom: listing.availableFrom,
      minimumLeaseTerm: listing.minimumLeaseTerm,
      annualRent: listing.annualRent,
      annualRentWithVat: this.withVat(listing.annualRent),
      currency: listing.currency,
      securityDepositMonths: listing.securityDepositMonths,
      status: listing.status,
      media: sortedMedia,
      thumbnailUrl: this.getThumbnailUrl(sortedMedia),
      isSaved: userId ? savedIds.has(listing._id.toString()) : undefined,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  private getThumbnailUrl(media: IListingMedia[]) {
    return [...media].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;
  }

  private withVat(annualRent: number) {
    return Math.round(annualRent * 1.15 * 100) / 100;
  }
}

export const listingService = new ListingService();
