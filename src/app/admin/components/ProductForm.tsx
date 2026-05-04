// app/admin/components/ProductForm.tsx (Updated)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowLeft, Save, Info, Trash2, Star } from 'lucide-react';
import { ProductSpecForm } from './ProductSpecForm';
import { ProductVariantManager } from './ProductVariantManager';
import ImageUploader from './ImageUploader';
import { TagInput } from './TagInput';
// import { IBrand } from '@/models/Brand';
// import { ICategory } from '@/types';


// ... (keep all interfaces the same)
interface Category {
  _id: string;
  name: string;
  specificationTemplate: Array<{
    groupName: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      unit?: string;
      options?: string[];
      required: boolean;
      filterable: boolean;
      isVariantAttribute: boolean;
      defaultValue?: unknown;
    }>;
    displayOrder: number;
  }>;
}

interface Brand {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brandId: string;
  categoryId: string;
  subcategoryId: string;
  thumbnail: string;
  images: string[];
  tags: string[];
  status: 'draft' | 'active' | 'archived';
}

interface ProductFormProps {
  initialData?: {
    formData: ProductFormData;
    specs: unknown[];
    variants: unknown[];
  };
  productId?: string;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export function ProductForm({ initialData, productId, isEditing = false, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryTemplate, setCategoryTemplate] = useState<Category['specificationTemplate']>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [categoryVersion, setCategoryVersion] = useState(0);

  const [formData, setFormData] = useState<ProductFormData>(() =>
    initialData?.formData || {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      brandId: '',
      categoryId: '',
      subcategoryId: '',
      thumbnail: '',
      images: [],
      tags: [],
      status: 'draft'
    }
  );

  const [specs, setSpecs] = useState<unknown[]>(initialData?.specs || []);
  const [variants, setVariants] = useState<unknown[]>(initialData?.variants || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cache for form data to prevent loss during re-renders
  const formDataCache = useRef(formData);
  const specsCache = useRef(specs);
  const variantsCache = useRef(variants);

  // Update caches when state changes
  useEffect(() => {
    formDataCache.current = formData;
  }, [formData]);

  useEffect(() => {
    specsCache.current = specs;
  }, [specs]);

  useEffect(() => {
    variantsCache.current = variants;
  }, [variants]);

  // Fetch categories and brands
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback(async (categoryId: string) => {
    setIsChangingCategory(true);

    setFormData(prev => ({ ...prev, categoryId }));
    setSelectedCategory(categoryId);

    const category = categories.find(c => c._id === categoryId);

    if (category) {
      const template = category.specificationTemplate || [];
      setCategoryTemplate(template);

      // 🔥 Reset EVERYTHING properly
      const initialSpecs = template.flatMap(group =>
        group.fields.map(field => ({
          key: field.key,
          label: field.label,
          value: field.defaultValue || '',
          group: group.groupName,
          unit: field.unit,
          filterable: field.filterable || false
        }))
      );

      specsCache.current = [];
      variantsCache.current = [];

      const variantAttrs = template.flatMap(group =>
        group.fields.filter(f => f.isVariantAttribute).map(f => f.key)
      );

      if (variantAttrs.length > 0) {
        setVariants([{
          sku: '',
          attributes: variantAttrs.map(attr => ({ key: attr, value: '' })),
          price: 0,
          inventory: 0,
          images: [],
          isDefault: true,
          status: 'in_stock'
        }]);
      } else {
        setVariants([]);
      }

      // 🔥 force full remount
      setCategoryVersion(prev => prev + 1);
    }

    setTimeout(() => setIsChangingCategory(false), 100);
  }, [categories]);

  // Initialize category template and specs when category is selected or editing
  useEffect(() => {
    if (selectedCategory && categories.length > 0 && !isChangingCategory) {
      const category = categories.find(c => c._id === selectedCategory);
      if (category) {
        setCategoryTemplate(category.specificationTemplate || []);

        if (isEditing && initialData && !isChangingCategory) {
          // For editing: use existing specs from initialData
          if (specsCache.current.length === 0 && initialData.specs.length > 0) {
            setSpecs(initialData.specs);
          }

          // For editing: use existing variants from initialData
          if (variantsCache.current.length === 0 && initialData.variants.length > 0) {
            setVariants(initialData.variants);
          }
        }
      }
    }
    setIsInitializing(false);
  }, [selectedCategory, categories, isEditing, initialData, isChangingCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      const flatCategories = Array.isArray(data) ? flattenCategories(data) : [];
      setCategories(flatCategories);

      // For editing: set selected category after categories are loaded
      if (isEditing && initialData?.formData.categoryId && !selectedCategory) {
        setSelectedCategory(initialData.formData.categoryId);
        setFormData(prev => ({ ...prev, categoryId: initialData.formData.categoryId }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const flattenCategories = (categories: any[]): Category[] => {
    let flat: Category[] = [];
    categories.forEach(cat => {
      flat.push({
        _id: cat._id,
        name: cat.name,
        specificationTemplate: cat.specificationTemplate || []
      });
      if (cat.children && cat.children.length > 0) {
        flat = [...flat, ...flattenCategories(cat.children)];
      }
    });
    return flat;
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBrands(data.data);
      } else if (Array.isArray(data)) {
        setBrands(data);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateVariantKey = (attributes: Array<{ key: string; value: string }>) => {
    if (!attributes || attributes.length === 0) {
      return 'default';
    }
    const sorted = [...attributes].sort((a, b) => a.key.localeCompare(b.key));
    const keyString = sorted.map(attr => `${attr.key}:${attr.value}`).join('|');
    return keyString || 'default';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brandId) {
      newErrors.brandId = 'Please select a brand';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.thumbnail) {
      newErrors.thumbnail = 'Please select a thumbnail image';
    }

    // Validate required specs
    const requiredSpecs = categoryTemplate.flatMap(group =>
      group.fields.filter(f => f.required).map(f => f.key)
    );

    const missingSpecs = requiredSpecs.filter(key =>
      !specs.some(s => s.key === key && s.value && s.value !== '')
    );

    if (missingSpecs.length > 0) {
      newErrors.specs = `Missing required specifications: ${missingSpecs.join(', ')}`;
    }

    // Validate variants
    if (variants.length === 0) {
      newErrors.variants = 'At least one variant is required';
    }

    const invalidSKUVariants = variants.filter(v => !v.sku || v.sku.trim().length === 0);
    if (invalidSKUVariants.length > 0) {
      newErrors.variants = `Please provide SKUs for all variants. ${invalidSKUVariants.length} variant(s) missing SKU.`;
    }

    const invalidPriceVariants = variants.filter(v => v.price <= 0);
    if (invalidPriceVariants.length > 0) {
      newErrors.variants = `All variants must have a price greater than 0. ${invalidPriceVariants.length} variant(s) have invalid price.`;
    }

    // Check for duplicate SKUs
    const skus = variants.map(v => v.sku);
    const duplicateSKUs = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateSKUs.length > 0) {
      newErrors.variants = `Duplicate SKUs found: ${duplicateSKUs.join(', ')}. Please ensure all SKUs are unique.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Process variants to ensure variantKey exists
    const processedVariants = variants.map((variant) => ({
      ...variant,
      variantKey:
        variant.variantKey && variant.variantKey !== ''
          ? variant.variantKey
          : generateVariantKey(variant.attributes || [])
    }));

    const productData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
      specsFlat: specs,
      variants: processedVariants
    };

    try {
      const url = isEditing && productId ? `/api/products/${productId}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess?.();
        router.push('/admin/products');
        router.refresh();
      } else {
        setErrors({ submit: data.error || `Failed to ${isEditing ? 'update' : 'create'} product` });
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} product:`, error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/admin/products');
        router.refresh();
      } else {
        const data = await res.json();
        setErrors({ delete: data.error || 'Failed to delete product' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrors({ delete: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle image upload without losing form data
  const handleImagesUpdate = useCallback((newImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  }, []);

  // Handle thumbnail change
  const handleThumbnailChange = useCallback((thumbnailUrl: string) => {
    setFormData(prev => ({
      ...prev,
      thumbnail: thumbnailUrl
    }));
  }, []);

  const variantAttributes = categoryTemplate.flatMap(group =>
    group.fields.filter(f => f.isVariantAttribute).map(f => f.key)
  );

  if (isInitializing && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - keep same */}
        <div className="mb-6">
          <Link href="/admin/products" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Product' : 'Create New Product'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Update product information' : 'Fill in the details to add a new product to your catalog'}
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </button>
            )}
          </div>
        </div>

        {/* Error Display - keep same */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside text-sm text-red-700">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete Confirmation Modal - keep same */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Product</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section - keep same */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Premium Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!formData.slug || (!isEditing && !formData.slug)) {
                      setFormData(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }));
                    }
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="auto-generated from name"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {isEditing ? 'URL-friendly identifier.' : 'URL-friendly identifier. Leave empty to auto-generate.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.categoryId ? 'border-red-500' : ''
                      }`}
                  >
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>
                  )}
                  {selectedCategory && !isEditing && (
                    <p className="mt-1 text-xs text-green-600">✓ Category template loaded. Specifications will appear below.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.brandId ? 'border-red-500' : ''
                      }`}
                  >
                    <option value="">Select a brand...</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                  {errors.brandId && (
                    <p className="mt-1 text-xs text-red-500">{errors.brandId}</p>
                  )}
                  {brands.length === 0 && (
                    <p className="mt-1 text-xs text-yellow-600">
                      {isEditing ? 'No brands found. Please create a brand first.' : 'No brands found. Please create a brand first via MongoDB or API.'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief description (10-500 characters)"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {isEditing ? 'Used in product listings and search results.' : 'Used in product listings and search results. Minimum 10 characters.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Detailed product description (50-5000 characters)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {isEditing ? '' : 'Minimum 50 characters. Provide detailed information about the product.'}
                </p>
              </div>
            </div>
          </div>

          {/* Product Specifications Section - FIXED with key prop */}
          {selectedCategory && categoryTemplate.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-2 mb-4">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Product Specifications</h2>
                  <p className="text-sm text-gray-500">
                    These specifications are defined by the selected category.
                    {!isEditing && ' Required fields are marked with a red border. Specifications marked as "variant attribute" will be used to create product variants.'}
                  </p>
                </div>
              </div>

              {/* Add key to force re-render when category changes */}
              <ProductSpecForm
                key={`specs-${selectedCategory}-${categoryVersion}`}
                groups={categoryTemplate}
                specs={specs}
                onChange={setSpecs}
              />
            </div>
          )}

          {/* Product Variants Section - FIXED with key prop */}
          {selectedCategory && variantAttributes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-2 mb-4">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Product Variants</h2>
                  <p className="text-sm text-gray-500">
                    Variants allow you to offer different versions of the same product based on attributes like size, color, or material.
                    {!isEditing && ' Use the "Generate Variants" button to quickly create all combinations.'}
                  </p>
                </div>
              </div>

              {/* Add key to force re-render when category changes */}
              <ProductVariantManager
                key={`variants-${selectedCategory}-${variants.length}`}
                variants={variants}
                onChange={setVariants}
                variantAttributes={variantAttributes}
              />
            </div>
          )}

          {/* Media Section - keep same */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Media</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Select which image will be the main product thumbnail. Click "Set as Thumbnail" on any image below.
              </p>

              {/* Thumbnail Preview */}
              {formData.thumbnail && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-amber-500 mb-4">
                  <NextImage
                    src={formData.thumbnail}
                    alt="Thumbnail"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white shadow-md flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Current Thumbnail
                  </div>
                </div>
              )}

              {!formData.thumbnail && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    No thumbnail selected. Please select a thumbnail from the images below.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Images
              </label>
              <ImageUploader
                images={formData.images}
                onUpload={handleImagesUpdate}
                onThumbnailChange={handleThumbnailChange}
                thumbnail={formData.thumbnail}
                maxImages={10}
              />
            </div>
          </div>

          {/* Tags & Status Section - keep same */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  placeholder="e.g., wireless, premium, headphones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="draft">Draft (Not visible to customers)</option>
                  <option value="active">Active (Visible to customers)</option>
                  <option value="archived">Archived (Hidden)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Buttons - keep same */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/products"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}