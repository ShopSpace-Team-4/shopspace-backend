import { ListingCategory } from '../../common/enums';
import {
  getListingCategoryFromAdvisorSources,
  mapAdvisorTaxonomyToListingCategory,
} from './advisor-category.mapper';

describe('advisor category mapper', () => {
  it('maps valid AI business types to ShopSpace listing categories', () => {
    expect(mapAdvisorTaxonomyToListingCategory('restaurant')).toBe(ListingCategory.RESTAURANT);
    expect(mapAdvisorTaxonomyToListingCategory('\u0645\u062d\u0644 \u0645\u0644\u0627\u0628\u0633')).toBe(ListingCategory.RETAIL);
  });

  it('normalizes casing and whitespace before mapping', () => {
    expect(mapAdvisorTaxonomyToListingCategory('  ReTaIl  ')).toBe(ListingCategory.RETAIL);
    expect(mapAdvisorTaxonomyToListingCategory('\u062a\u0631\u0632\u064a / \u062e\u064a\u0627\u0637\u0629')).toBe(ListingCategory.OFFICE);
  });

  it('prefers business_type and falls back to category when category is a valid listing category', () => {
    const sources = [
      { document_id: '1', title: 'General', category: 'operations', business_type: 'general' },
      { document_id: '2', title: 'Office', category: ' office ', business_type: '' },
      { document_id: '3', title: 'Retail', category: 'legal', business_type: 'supermarket' },
      {
        document_id: '4',
        title: 'Retail 2',
        category: 'financial',
        business_type: '\u0645\u062d\u0644 \u0645\u0648\u0628\u0627\u064a\u0644\u0627\u062a',
      },
    ];

    expect(getListingCategoryFromAdvisorSources(sources)).toBe(ListingCategory.RETAIL);
  });

  it('returns undefined for unknown AI taxonomy values', () => {
    expect(mapAdvisorTaxonomyToListingCategory('location')).toBeUndefined();
    expect(mapAdvisorTaxonomyToListingCategory('totally unknown business')).toBeUndefined();
    expect(getListingCategoryFromAdvisorSources([])).toBeUndefined();
  });
});
