import { listingRepository } from '../../DB/repository/listing.repository';
import { userRepository } from '../../DB/repository/user.repository';
import { ListingCategory, ListingStatus } from '../../common/enums';
import { listingService } from './listing.service';

jest.mock('../../DB/repository/listing.repository', () => ({
  listingRepository: {
    findWithPagination: jest.fn(),
  },
}));

jest.mock('../../DB/repository/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../common/services/upload.service', () => ({
  uploadService: {
    delete: jest.fn(),
  },
}));

describe('ListingService list filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(listingRepository.findWithPagination).mockResolvedValue({ items: [], total: 0 });
    jest.mocked(userRepository.findById).mockResolvedValue(null);
  });

  it('keeps accepting valid ShopSpace listing categories', async () => {
    await listingService.list({
      category: ListingCategory.RETAIL,
      status: ListingStatus.AVAILABLE,
    }, '64b64c06b0f5f0f5f0f5f0f5');

    expect(listingRepository.findWithPagination).toHaveBeenCalledWith(
      expect.objectContaining({
        category: ListingCategory.RETAIL,
        status: ListingStatus.AVAILABLE,
      }),
      { createdAt: -1 },
      0,
      20
    );
  });
});
