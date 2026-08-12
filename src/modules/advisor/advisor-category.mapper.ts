import { ListingCategory } from '../../common/enums';
import { AiAdvisorSource } from '../../common/services/ai-advisor.service';

const EXACT_CATEGORY_BY_KEY = new Map(
  Object.values(ListingCategory).map((category) => [normalizeTaxonomyValue(category), category])
);

const BUSINESS_TYPE_ALIASES = new Map<string, ListingCategory>();

addAliases(ListingCategory.RESTAURANT, [
  'cafe',
  'cafeteria',
  'coffee',
  'restaurant',
  'bakery',
  'food',
  '\u0645\u0637\u0639\u0645',
  '\u0643\u0627\u0641\u064a\u0647',
  '\u0643\u0627\u0641\u064a\u0647\u0627\u062a',
  '\u0645\u062e\u0628\u0632',
]);

addAliases(ListingCategory.RETAIL, [
  'retail',
  'shop',
  'store',
  'supermarket',
  'pharmacy',
  'cosmetics',
  'clothing',
  'mobile',
  'bookstore',
  'gifts',
  'herbal',
  '\u0645\u062d\u0644',
  '\u0645\u062a\u062c\u0631',
  '\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062a',
  '\u0635\u064a\u062f\u0644\u064a\u0629',
  '\u0645\u062d\u0644 \u0645\u0644\u0627\u0628\u0633',
  '\u0645\u062d\u0644 \u0645\u0648\u0628\u0627\u064a\u0644\u0627\u062a',
  '\u0645\u062d\u0644 \u0645\u0633\u062a\u062d\u0636\u0631\u0627\u062a \u0627\u0644\u062a\u062c\u0645\u064a\u0644',
  '\u0645\u062d\u0644 \u0639\u0637\u0627\u0631\u0629',
  '\u0645\u062d\u0644 \u062e\u0636\u0627\u0631 \u0648\u0641\u0627\u0643\u0647\u0629',
  '\u0645\u062d\u0644 \u0642\u0637\u0639 \u063a\u064a\u0627\u0631 \u0633\u064a\u0627\u0631\u0627\u062a',
  '\u0645\u0643\u062a\u0628\u0629 \u0648\u0647\u062f\u0627\u064a\u0627',
]);

addAliases(ListingCategory.OFFICE, [
  'office',
  'clinic',
  'salon',
  'barbershop',
  'laundry',
  'tailoring',
  '\u0635\u0627\u0644\u0648\u0646 \u062d\u0644\u0627\u0642\u0629',
  '\u0643\u0648\u0627\u0641\u064a\u0631 \u0646\u0633\u0627\u0626\u064a',
  '\u0645\u063a\u0633\u0644\u0629 \u0645\u0644\u0627\u0628\u0633 \u0648\u0645\u0643\u0648\u062c\u064a',
  '\u062a\u0631\u0632\u064a \u062e\u064a\u0627\u0637\u0629',
]);

addAliases(ListingCategory.WAREHOUSE, [
  'warehouse',
  'storage',
  'workshop',
  'carpentry',
  '\u0648\u0631\u0634\u0629 \u0646\u062c\u0627\u0631\u0629',
]);

addAliases(ListingCategory.KIOSK, [
  'kiosk',
  'booth',
  '\u0643\u0634\u0643',
]);

addAliases(ListingCategory.SHOWROOM, [
  'showroom',
  'appliances',
  'housewares',
  '\u0645\u062d\u0644 \u0623\u062c\u0647\u0632\u0629 \u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629 \u0648\u0623\u062f\u0648\u0627\u062a \u0645\u0646\u0632\u0644\u064a\u0629',
]);

export function getListingCategoryFromAdvisorSources(sources: AiAdvisorSource[] = []) {
  const counts = new Map<ListingCategory, number>();

  for (const source of sources) {
    const category = getListingCategoryFromAdvisorSource(source);
    if (!category) continue;
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export function getListingCategoryFromAdvisorSource(source: Pick<AiAdvisorSource, 'business_type' | 'category'>) {
  return mapAdvisorTaxonomyToListingCategory(source.business_type) ?? mapAdvisorTaxonomyToListingCategory(source.category);
}

export function mapAdvisorTaxonomyToListingCategory(value?: string | null) {
  const normalized = normalizeTaxonomyValue(value);
  if (!normalized || normalized === 'general') return undefined;

  return EXACT_CATEGORY_BY_KEY.get(normalized) ?? BUSINESS_TYPE_ALIASES.get(normalized);
}

function addAliases(category: ListingCategory, aliases: string[]) {
  for (const alias of aliases) {
    BUSINESS_TYPE_ALIASES.set(normalizeTaxonomyValue(alias), category);
  }
}

function normalizeTaxonomyValue(value?: string | null) {
  return (value || '')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
