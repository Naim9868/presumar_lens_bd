// app/admin/categories/create/page.tsx
'use client';

import CategoryForm from '@/app/admin/components/CategoryForm';

export default function CreateCategoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Category</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new product category to organize your products
          </p>
        </div>
        
        <CategoryForm />
      </div>
    </div>
  );
}