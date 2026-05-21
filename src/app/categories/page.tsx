// app/category/page.tsx
import { Metadata } from 'next';
import { fetchCategories } from '@/app/actions/category.actions';
import CategoriesClient from './CategoriesClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'All Categories - ProsumerLensBD',
  description: 'Browse all our mobile photography categories including macro lenses, telephoto lenses, wide angle lenses, gimbals, tripods, and creator gear.',
};

export default async function CategoriesPage() {
  // Fetch all categories on the server
  const categories = await fetchCategories();
  
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesClient initialCategories={categories} />
    </Suspense>
  );
}

// Loading skeleton
function CategoriesSkeleton() {
  return (
    <div className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-16 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto mb-4 animate-pulse"></div>
          <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 animate-pulse">
              <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto mb-4"></div>
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}