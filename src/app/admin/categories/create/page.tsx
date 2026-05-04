// app/admin/categories/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
  unit?: string;
  options?: string[];
  required: boolean;
  filterable: boolean;
  isVariantAttribute: boolean;
  defaultValue?: any;
}

interface CategoryGroup {
  groupName: string;
  fields: CategoryField[];
  displayOrder: number;
}

export default function CreateCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    status: 'active' as 'active' | 'inactive'
  });
  
  const [specGroups, setSpecGroups] = useState<CategoryGroup[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      // Flatten the category tree for parent selection
      const flatCategories = flattenCategories(data);
      setCategories(flatCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const flattenCategories = (categories: any[]): Category[] => {
    let flat: Category[] = [];
    categories.forEach(cat => {
      flat.push({ _id: cat._id, name: cat.name, slug: cat.slug, parentId: cat.parentId });
      if (cat.children && cat.children.length > 0) {
        flat = [...flat, ...flattenCategories(cat.children)];
      }
    });
    return flat;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const addSpecGroup = () => {
    const newGroup: CategoryGroup = {
      groupName: `New Group ${specGroups.length + 1}`,
      fields: [],
      displayOrder: specGroups.length
    };
    setSpecGroups([...specGroups, newGroup]);
  };

  const removeSpecGroup = (index: number) => {
    setSpecGroups(specGroups.filter((_, i) => i !== index));
  };

  const updateSpecGroup = (index: number, updates: Partial<CategoryGroup>) => {
    const newGroups = [...specGroups];
    newGroups[index] = { ...newGroups[index], ...updates };
    setSpecGroups(newGroups);
  };

  const addSpecField = (groupIndex: number) => {
    const newField: CategoryField = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      filterable: false,
      isVariantAttribute: false
    };
    const newGroups = [...specGroups];
    newGroups[groupIndex].fields.push(newField);
    setSpecGroups(newGroups);
  };

  const removeSpecField = (groupIndex: number, fieldIndex: number) => {
    const newGroups = [...specGroups];
    newGroups[groupIndex].fields.splice(fieldIndex, 1);
    setSpecGroups(newGroups);
  };

  const updateSpecField = (groupIndex: number, fieldIndex: number, updates: Partial<CategoryField>) => {
    const newGroups = [...specGroups];
    newGroups[groupIndex].fields[fieldIndex] = { ...newGroups[groupIndex].fields[fieldIndex], ...updates };
    setSpecGroups(newGroups);
  };

  // app/admin/categories/create/page.tsx - Update the handleSubmit function

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  if (!formData.name) {
    setErrors({ name: 'Category name is required' });
    setLoading(false);
    return;
  }

  // Clean up the specification template
  const cleanSpecGroups = specGroups
    .filter(group => group.groupName && group.groupName.trim() !== '')
    .map(group => ({
      groupName: group.groupName.trim(),
      displayOrder: group.displayOrder,
      fields: group.fields
        .filter(field => field.key && field.key.trim() !== '' && field.label && field.label.trim() !== '')
        .map(field => ({
          key: field.key.trim(),
          label: field.label.trim(),
          type: field.type,
          unit: field.unit || undefined,
          options: field.options && field.options.length > 0 ? field.options : undefined,
          required: field.required || false,
          filterable: field.filterable || false,
          isVariantAttribute: field.isVariantAttribute || false,
          defaultValue: field.defaultValue
        }))
    }));

  const categoryData = {
    name: formData.name.trim(),
    slug: formData.slug || undefined,
    parentId: formData.parentId || undefined,
    status: formData.status,
    specificationTemplate: cleanSpecGroups
  };

  // Remove parentId if empty string
  if (!categoryData.parentId) {
    delete categoryData.parentId;
  }

  console.log('Submitting category data:', categoryData);

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/admin/categories');
    } else {
      setErrors({ submit: data.error || 'Failed to create category' });
    }
  } catch (error) {
    console.error('Error creating category:', error);
    setErrors({ submit: 'An error occurred. Please try again.' });
  } finally {
    setLoading(false);
  }
};

  // Get category name with indentation for display
  const getCategoryDisplay = (category: Category, level = 0): string => {
    return '—'.repeat(level) + ' ' + category.name;
  };

  // Build hierarchical options for parent dropdown
  const buildParentOptions = (categories: Category[], level = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    
    categories.forEach(cat => {
      options.push(
        <option key={cat._id} value={cat._id}>
          {' '.repeat(level * 4)}{cat.name}
        </option>
      );
      // Add children if they exist (not in flat list)
      // This would require recursive logic
    });
    
    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/categories" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Categories
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Category</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new category or subcategory to organize your products</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Electronics, Clothing, Books"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!formData.slug) {
                      setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                    }
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="auto-generated from name"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier. Leave empty to auto-generate.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">None (Top Level Category)</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a parent category to make this a subcategory. Leave empty for top-level category.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specification Template */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Specification Template</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define what specifications products in this category can have.
                  Specifications marked as "variant attributes" will be used to generate product variants.
                </p>
              </div>
              <button
                type="button"
                onClick={addSpecGroup}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Group
              </button>
            </div>

            {specGroups.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No specification groups defined yet.</p>
                <button
                  type="button"
                  onClick={addSpecGroup}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Add your first group
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {specGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <input
                        type="text"
                        placeholder="Group Name (e.g., Technical Specs)"
                        value={group.groupName}
                        onChange={(e) => updateSpecGroup(groupIndex, { groupName: e.target.value })}
                        className="text-md font-medium rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-64"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecGroup(groupIndex)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 pl-4">
                      {group.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border-l-2 border-gray-200 pl-3 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <input
                              type="text"
                              placeholder="Key (e.g., processor)"
                              value={field.key}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { key: e.target.value })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Label (e.g., Processor)"
                              value={field.label}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { label: e.target.value })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <select
                              value={field.type}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { type: e.target.value as any })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="select">Select</option>
                              <option value="multiselect">Multi-Select</option>
                              <option value="boolean">Boolean</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                            <input
                              type="text"
                              placeholder="Unit (e.g., GHz, mm)"
                              value={field.unit || ''}
                              onChange={(e) => updateSpecField(groupIndex, fieldIndex, { unit: e.target.value })}
                              className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            
                            {(field.type === 'select' || field.type === 'multiselect') && (
                              <input
                                type="text"
                                placeholder="Options (comma separated)"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateSpecField(groupIndex, fieldIndex, { 
                                  options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                                })}
                                className="col-span-2 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                              />
                            )}
                            
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateSpecField(groupIndex, fieldIndex, { required: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.filterable}
                                  onChange={(e) => updateSpecField(groupIndex, fieldIndex, { filterable: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Filterable
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.isVariantAttribute}
                                  onChange={(e) => updateSpecField(groupIndex, fieldIndex, { isVariantAttribute: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Variant Attribute
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSpecField(groupIndex, fieldIndex)}
                            className="text-xs text-red-600 hover:text-red-800 mt-1"
                          >
                            Remove field
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addSpecField(groupIndex)}
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
              <ul className="list-disc list-inside text-sm text-red-700">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/categories"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}