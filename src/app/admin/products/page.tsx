// src/app/admin/products/page.tsx
import { getProducts } from '@/app/actions/product/getProducts';
import ProductList from '@/components/admin/ProductList';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    featured?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;

  const result = await getProducts({
    query: params.search,
    status: params.status as any,
    minPrice: params.minPrice
      ? parseFloat(params.minPrice)
      : undefined,
    maxPrice: params.maxPrice
      ? parseFloat(params.maxPrice)
      : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
      </div>

      <ProductList
        initialProducts={result.products}
        initialPagination={result.pagination}
      />
    </div>
  );
}