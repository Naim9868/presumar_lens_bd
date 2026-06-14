// src/app/admin/categories/page.tsx
import { getCategories } from '@/app/actions/category/getCategories';
import CategoriesManager from '@/components/admin/CategoriesManager';

export default async function CategoriesPage() {
  const categories = await getCategories({ includeInactive: true });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1">Manage your product categories and subcategories</p>
      </div>
      
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}