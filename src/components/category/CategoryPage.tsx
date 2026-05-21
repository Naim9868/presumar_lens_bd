// app/components/category/CategoryServer.tsx
import { fetchCategories } from "@/app/actions/category.actions";
import CategoryClient from "./CategoryClient";
import { Suspense } from "react";

export default async function CategoryServer() {
  // Fetch data on the server - this already returns ALL categories with hierarchy
  const categories = await fetchCategories();
  
  // Pass data to client component
  return (
    <Suspense fallback={
      <div className="py-16 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 dark:bg-slate-800 rounded-full mx-auto mb-4"></div>
                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CategoryClient initialCategories={categories} />
    </Suspense>
  );
}