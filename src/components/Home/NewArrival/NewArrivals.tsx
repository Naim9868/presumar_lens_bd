// components/products/NewArrivals.tsx
import { getNewArrivals } from '@/app/actions/product.actions';
import NewArrivalsClient from './NewArrivalsClient';
import { Suspense } from 'react';

interface NewArrivalsProps {
  limit?: number;
  title?: string;
  subtitle?: string;
}

export default async function NewArrivals({ 
  limit = 8, 
  title = "New Arrivals",
  subtitle = "Fresh gear just landed. Be the first to get your hands on these."
}: NewArrivalsProps) {
  const { products } = await getNewArrivals(limit);
  
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <NewArrivalsClient 
        products={products} 
        title={title}
        subtitle={subtitle}
      />
    </Suspense>
  );
}

function ProductsSkeleton() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto mb-4 animate-pulse"></div>
          <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto mb-3 animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto animate-pulse"></div>
        </div>
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
    </section>
  );
}