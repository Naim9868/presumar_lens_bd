// app/products/page.tsx
import { Metadata } from 'next';
import { getAllProducts, getAllBrands } from '@/app/actions/product.actions';
import ProductsClient from './ProductsClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'All Products - ProsumerLensBD',
  description: 'Shop premium mobile photography gear including lenses, gimbals, tripods, and creator accessories.',
};

export default async function ProductsPage() {
  // Fetch initial products and brands using server actions (SSR for SEO)
  const [productsResult, brandsResult] = await Promise.all([
    getAllProducts({ page: 1, limit: 12, sortBy: 'newest' }),
    getAllBrands(),
  ]);

  
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsClient
        initialProducts={productsResult.products}
        initialTotal={productsResult.total}
        brands={brandsResult.success ? brandsResult.brands : []}
      />
    </Suspense>
  );
}

// Loading skeleton
function ProductsPageSkeleton() {
  return (
    <div className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-12 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded-full mb-8 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200 dark:bg-slate-800"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}