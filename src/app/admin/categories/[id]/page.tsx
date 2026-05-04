// app/admin/categories/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X, Trash2 } from 'lucide-react';

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

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  specificationTemplate: CategoryGroup[];
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      const [categoryRes, categoriesRes] = await Promise.all([
        fetch(`/api/categories/${categoryId}`),
        fetch('/api/categories')
      ]);
      
      const category = await categoryRes.json();
      const allCategories = await categoriesRes.json();
      
      // Flatten categories for parent dropdown
      const flatCategories = flattenCategories(allCategories);
      // Exclude current category and its children to prevent circular references
      const filteredCategories = flatCategories.filter(cat => {
        if (cat._id === categoryId) return false;
        // Also prevent selecting children as parent (circular reference)
        if (isDescendant(cat._id, categoryId, flatCategories)) return false;
        return true;
      });
      
      setCategories(filteredCategories);
      setFormData({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId || '',
        status: category.status
      });
      setSpecGroups(category.specificationTemplate || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten category tree to array
  const flattenCategories = (categories: any[]): Category[] => {
    let flat: Category[] = [];
    const flatten = (items: any[]) => {
      items.forEach(item => {
        flat.push({
          _id: item._id,
          name: item.name,
          slug: item.slug,
          parentId: item.parentId,
          status: item.status,
          specificationTemplate: item.specificationTemplate || []
        });
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };
    flatten(categories);
    return flat;
  };

  // Check if a category is a descendant of another
  const isDescendant = (potentialChildId: string, potentialParentId: string, categoriesList: Category[]): boolean => {
    let currentId = potentialChildId;
    while (currentId) {
      const category = categoriesList.find(c => c._id === currentId);
      if (!category || !category.parentId) break;
      if (category.parentId === potentialParentId) return true;
      currentId = category.parentId;
    }
    return false;
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
    if (confirm('Remove this specification group? All fields in this group will be deleted.')) {
      setSpecGroups(specGroups.filter((_, i) => i !== index));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    if (!formData.name) {
      setErrors({ name: 'Category name is required' });
      setSaving(false);
      return;
    }

    // Check for circular reference
    if (formData.parentId === categoryId) {
      setErrors({ parentId: 'A category cannot be its own parent' });
      setSaving(false);
      return;
    }

    const categoryData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
      specificationTemplate: specGroups
    };

    // Remove parentId if empty string
    if (!categoryData.parentId || categoryData.parentId === '') {
      delete categoryData.parentId;
    }

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });

      if (res.ok) {
        router.push('/admin/categories');
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || 'Failed to update category' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/categories" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Categories
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
          <p className="text-sm text-gray-500 mt-1">Update category information and specification template</p>
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
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
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
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.parentId ? 'border-red-500' : ''
                  }`}
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
                {errors.parentId && <p className="mt-1 text-xs text-red-500">{errors.parentId}</p>}
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
                        title="Remove group"
                      >
                        <Trash2 className="h-4 w-4" />
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
                            
                            <div className="flex items-center gap-2 flex-wrap">
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
                                Variant
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSpecField(groupIndex, fieldIndex)}
                            className="text-xs text-red-600 hover:text-red-800 mt-1 inline-flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
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
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}