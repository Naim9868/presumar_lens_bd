'use client';

import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

interface CategoryFormProps {
  initialData?: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
  };
  categories?: Array<{ _id: string; name: string }>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function CategoryForm({
  initialData,
  categories = [],
  onSubmit,
  onCancel,
  loading = false
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    parentId: initialData?.parentId || '',
    isActive: initialData?.isActive ?? true
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Category Name"
        value={formData.name}
        onChange={handleNameChange}
        required
        placeholder="e.g., Prime Lenses"
        autoFocus
      />
      
      <Input
        label="Slug"
        value={formData.slug}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
        required
        placeholder="auto-generated-from-name"
        helpText="URL-friendly version of the name"
      />
      
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Parent Category
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">None (Top Level)</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <Input
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        textarea
        rows={3}
        placeholder="Brief description of this category"
      />
      
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Active (visible to customers)
        </span>
      </label>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}