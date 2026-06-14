// app/components/category/CategoryServer.tsx
import { getCategories } from "@/app/actions/category/getCategories";
import CategoryClient from "./CategoryClient";
import { Suspense } from "react";
import { FolderTree, AlertCircle } from "lucide-react";

// Loading skeleton component
const CategorySkeleton = () => (
  <div className="py-16 bg-gray-50 dark:bg-slate-950">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto mb-4 animate-pulse"></div>
        <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto animate-pulse"></div>
      </div>
      
      {/* Filter Buttons Skeleton */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2 bg-gray-200 dark:bg-slate-800 rounded-full p-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-24 h-9 bg-gray-300 dark:bg-slate-700 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Categories Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="pt-8 px-6 pb-3">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="w-full h-full bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto w-1/2 mb-3"></div>
              <div className="flex justify-center gap-3">
                <div className="h-3 w-16 bg-gray-200 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error component
const CategoryError = ({ error }: { error: string }) => (
  <div className="py-16 bg-gray-50 dark:bg-slate-950">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Categories
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
          {error || "There was an issue loading the categories. Please try again later."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export default async function CategoryServer() {
  try {
    // Fetch data on the server - this returns hierarchical categories
    const categories = await getCategories({ includeInactive: false });
    
    // Ensure categories is always an array
    const safeCategories = Array.isArray(categories) ? categories : [];
    
    // If no categories, show empty state
    if (safeCategories.length === 0) {
      return (
        <div className="py-16 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FolderTree className="w-4 h-4" />
                Shop by Category
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Explore Our Collections
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover premium mobile photography gear curated for creators who demand excellence
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm">
              <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Categories Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're curating our collections. Check back soon for amazing photography gear!
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Pass data to client component with Suspense for loading state
    return (
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryClient initialCategories={safeCategories} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading categories:", error);
    
    // Handle error gracefully
    const errorMessage = error instanceof Error ? error.message : "Failed to load categories";
    
    return (
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryError error={errorMessage} />
      </Suspense>
    );
  }
}