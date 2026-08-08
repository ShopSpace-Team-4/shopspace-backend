import { FilterQuery, Types } from 'mongoose';
import { listingRepository } from '../../DB/repository/listing.repository';
import { userRepository } from '../../DB/repository/user.repository';
import { IListing, IListingMedia } from '../../common/interfaces/listing.interface';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../common/exceptions';
import { ListingAmenity, ListingCategory, ListingStatus, MediaType, Role } from '../../common/enums';
import { CreateListingDto, ReorderMediaDto, UpdateListingDto, UpdateListingStatusDto } from './listing.dto';
import { StoredUpload, uploadService } from '../../common/services/upload.service';
import { createWhatsAppLink } from '../../common/utils/whatsapp-link.util';

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
    const page = this.parsePositiveInteger(query.page, 'page', 1);
    const limit = this.parsePositiveInteger(query.limit, 'limit', 20, 100);
    const sort = this.buildSort(this.getQueryValue(query.sort, 'sort'));
    const { items: listings, total } = await listingRepository.findWithPagination(
      filter,
      sort,
      (page - 1) * limit,
      limit
    );
    const savedIds = await this.getSavedListingIds(userId);

    return {
      items: listings.map((listing) => this.toListingResponse(listing, userId, savedIds)),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, userId?: string) {
    const listing = await this.findListing(id);
    const [savedIds, landlord] = await Promise.all([
      this.getSavedListingIds(userId),
      userRepository.findById(listing.landlordId),
    ]);
    const whatsappLink = this.getWhatsAppLink(landlord?.phone, listing.title);
    return this.toListingResponse(listing, userId, savedIds, whatsappLink);
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

  async addMedia(id: string, userId: string, uploads: StoredUpload[]) {
    const listing = await this.findOwnedListing(id, userId);
    const media = [
      ...listing.media,
      ...uploads.map((upload, index) => ({
        mediaType: MediaType.IMAGE,
        url: upload.url,
        publicId: upload.publicId,
        sortOrder: listing.media.length + index,
      })),
    ];
    const updated = await listingRepository.updateById(listing._id, { media });
    if (!updated) throw new NotFoundException('Listing');
    return this.toListingResponse(updated, userId);
  }

  async deleteMedia(id: string, userId: string, mediaId: string) {
    const listing = await this.findOwnedListing(id, userId);
    const deletedMedia = listing.media.find((item) => item._id?.toString() === mediaId);
    if (deletedMedia?.publicId) {
      uploadService.delete(deletedMedia.publicId).catch((error) => {
        console.error(`Failed to delete Cloudinary media ${deletedMedia.publicId}`, error);
      });
    }
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
    const city = this.getQueryValue(query.city, 'city');
    const area = this.getQueryValue(query.area, 'area') ?? this.getQueryValue(query.district, 'district');
    const shopType = this.getQueryValue(query.shopType, 'shopType') ?? this.getQueryValue(query.category, 'category');
    const status = this.getQueryValue(query.status, 'status');
    const priceMin = this.getQueryValue(query.priceMin, 'priceMin');
    const priceMax = this.getQueryValue(query.priceMax, 'priceMax');
    const sizeMin = this.getQueryValue(query.sizeMin, 'sizeMin') ?? this.getQueryValue(query.areaMin, 'areaMin');
    const sizeMax = this.getQueryValue(query.sizeMax, 'sizeMax') ?? this.getQueryValue(query.areaMax, 'areaMax');

    if (city) filter.city = city;
    if (area) filter.district = area;
    if (shopType) {
      if (!Object.values(ListingCategory).includes(shopType as ListingCategory)) {
        throw new BadRequestException('Invalid shopType');
      }
      filter.category = shopType as ListingCategory;
    }
    if (status) {
      if (!Object.values(ListingStatus).includes(status as ListingStatus)) {
        throw new BadRequestException('Invalid status');
      }
      filter.status = status as ListingStatus;
    }
    if (priceMin !== undefined || priceMax !== undefined) filter.annualRent = this.range(priceMin, priceMax, 'price');
    if (sizeMin !== undefined || sizeMax !== undefined) filter.areaSqm = this.range(sizeMin, sizeMax, 'size');
    if (query.amenities) {
      const amenities = Array.isArray(query.amenities) ? query.amenities : query.amenities.split(',');
      filter.amenities = { $all: amenities as ListingAmenity[] };
    }
    return filter;
  }

  private range(min: string | undefined, max: string | undefined, field: string) {
    const query: { $gte?: number; $lte?: number } = {};
    if (min !== undefined) query.$gte = this.parseNonNegativeNumber(min, `${field}Min`);
    if (max !== undefined) query.$lte = this.parseNonNegativeNumber(max, `${field}Max`);
    if (query.$gte !== undefined && query.$lte !== undefined && query.$gte > query.$lte) {
      return { $gt: query.$gte, $lt: query.$lte };
    }
    return query;
  }

  private buildSort(sort?: string) {
    const [requestedField = 'createdAt', direction = 'desc'] = (sort?.trim() || 'createdAt:desc').split(':');
    const fields: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      annualRent: 'annualRent',
      price: 'annualRent',
      areaSqm: 'areaSqm',
      size: 'areaSqm',
      title: 'title',
    };
    const field = fields[requestedField];
    if (!field || !['asc', 'desc'].includes(direction)) {
      throw new BadRequestException('Invalid sort. Use field:asc or field:desc');
    }
    return { [field]: direction === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;
  }

  private getQueryValue(value: string | string[] | undefined, field: string) {
    if (Array.isArray(value)) throw new BadRequestException(`${field} must be provided once`);
    return value;
  }

  private parsePositiveInteger(value: string | string[] | undefined, field: string, fallback: number, maximum?: number) {
    const rawValue = this.getQueryValue(value, field);
    if (rawValue === undefined) return fallback;
    if (!/^\d+$/.test(rawValue)) throw new BadRequestException(`${field} must be a positive integer`);
    const parsed = Number(rawValue);
    if (parsed < 1) {
      throw new BadRequestException(`${field} must be at least 1`);
    }
    return maximum !== undefined ? Math.min(parsed, maximum) : parsed;
  }

  private parseNonNegativeNumber(value: string, field: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }
    return parsed;
  }

  private toListingResponse(listing: IListing, userId?: string, savedIds = new Set<string>(), whatsappLink?: string | null) {
    const sortedMedia = [...listing.media].sort((a, b) => a.sortOrder - b.sortOrder);
    const responseMedia = sortedMedia.map((item) => ({
      _id: item._id,
      mediaType: item.mediaType,
      url: item.url,
      sortOrder: item.sortOrder,
    }));
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
      media: responseMedia,
      thumbnailUrl: this.getThumbnailUrl(sortedMedia),
      isSaved: userId ? savedIds.has(listing._id.toString()) : undefined,
      ...(whatsappLink !== undefined ? { whatsappLink } : {}),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  private getThumbnailUrl(media: IListingMedia[]) {
    return [...media].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;
  }

  private getWhatsAppLink(phoneNumber: string | undefined, listingTitle: string) {
    if (!phoneNumber) return null;
    try {
      return createWhatsAppLink(phoneNumber, listingTitle);
    } catch (error) {
      console.error(`Invalid landlord phone for WhatsApp link on listing "${listingTitle}"`, error);
      return null;
    }
  }

  private withVat(annualRent: number) {
    return Math.round(annualRent * 1.15 * 100) / 100;
  }
}

export const listingService = new ListingService();
