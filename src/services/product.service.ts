import { Product } from '../models/Product';

type SearchProductsParams = {
  query?: string;
  categoryId?: string;
  specs?: Record<string, unknown>;
  page?: number;
  limit?: number;
};

export async function searchProducts({
  query,
  categoryId,
  specs = {},
  page = 1,
  limit = 20
}: SearchProductsParams) {

  const filter: Record<string, unknown> = {
    status: 'active',
    deletedAt: null
  };

  if (query) {
    filter.$text = { $search: query };
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  const specFilters = Object.entries(specs).map(([key, value]) => ({
    $elemMatch: { key, value }
  }));

  if (specFilters.length > 0) {
    filter.specsFlat = { $all: specFilters };
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .lean();

  return products;
}