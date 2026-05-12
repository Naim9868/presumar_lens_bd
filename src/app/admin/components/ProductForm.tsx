// app/admin/components/ProductForm.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowLeft, Save, Info, Trash2, Star, AlertCircle } from 'lucide-react';
import { ProductSpecForm } from './ProductSpecForm';
import { ProductVariantManager } from './ProductVariantManager';
import ImageUploader from './ImageUploader';
import { TagInput } from './TagInput';
import { Category, Brand, SpecGroup } from '@/types';
import { VariantAttribute, ProductVariant, ProductSpec } from '@/types/product';

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
    specs: ProductSpec[];
    variants: ProductVariant[];
  };
  productId?: string;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export type { ProductSpec, ProductVariant, ProductFormData, Category, Brand };

// Helper function to safely convert defaultValue to appropriate type
const normalizeDefaultValue = (value: unknown, type: string): string | number | boolean | string[] => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0;
    case 'boolean':
      return typeof value === 'boolean' ? value : Boolean(value);
    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'multiselect':
      return Array.isArray(value) ? value : [];
    case 'select':
    case 'text':
    case 'textarea':
    default:
      return String(value);
  }
};

// Helper function to normalize keys for matching
function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function ProductForm({ initialData, productId, isEditing = false, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryTemplate, setCategoryTemplate] = useState<SpecGroup[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [categoryVersion, setCategoryVersion] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

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

  const [specs, setSpecs] = useState<ProductSpec[]>(() => initialData?.specs || []);
  const [variants, setVariants] = useState<ProductVariant[]>(() => initialData?.variants || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string>('');
  const [specValidation, setSpecValidation] = useState({ isValid: true, missingRequired: [] as string[] });
  const [isSpecsInitialized, setIsSpecsInitialized] = useState(false);

  // Refs for scrolling to errors
  const errorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Cache refs
  const formDataCache = useRef(formData);
  const specsCache = useRef(specs);
  const variantsCache = useRef(variants);

  // Update caches
  useEffect(() => {
    formDataCache.current = formData;
  }, [formData]);

  useEffect(() => {
    specsCache.current = specs;
  }, [specs]);

  useEffect(() => {
    variantsCache.current = variants;
  }, [variants]);

  // Auto-scroll to error function
  const scrollToError = useCallback(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey && errorRefs.current[firstErrorKey]) {
      errorRefs.current[firstErrorKey]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      const element = errorRefs.current[firstErrorKey];
      if (element) {
        element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
        }, 2000);
      }
    } else if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors]);

  // Trigger scroll when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      scrollToError();
    }
  }, [errors, scrollToError]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

      // For editing mode with existing specs, don't overwrite them
      if (!isEditing || !initialData?.specs || initialData.specs.length === 0) {
        // Initialize specs from template with proper value conversion
        const initialSpecs: ProductSpec[] = template.flatMap(group =>
          group.fields.map(field => ({
            key: field.key,
            label: field.label,
            value: normalizeDefaultValue(field.defaultValue, field.type || 'text') as string | number | boolean,
            group: group.groupName,
            unit: field.unit,
            filterable: field.filterable ?? false
          }))
        );
        setSpecs(initialSpecs);
        specsCache.current = initialSpecs;
      }

      // Initialize variants based on variant attributes (only if no existing variants)
      const variantAttrs = template.flatMap(group =>
        group.fields.filter(f => f.isVariantAttribute).map(f => f.key)
      );

      if (variantAttrs.length > 0 && (!isEditing || !initialData?.variants || initialData.variants.length === 0)) {
        const initialVariants: ProductVariant[] = [{
          sku: '',
          attributes: variantAttrs.map(attr => ({ key: attr, value: '' })),
          price: 0,
          inventory: 0,
          images: [],
          isDefault: true,
          status: 'in_stock'
        }];
        setVariants(initialVariants);
        variantsCache.current = initialVariants;
      }

      // Force remount of spec and variant components
      setCategoryVersion(prev => prev + 1);
    }

    setTimeout(() => setIsChangingCategory(false), 100);
  }, [categories, isEditing, initialData]);

  // Handle spec validation change
  const handleSpecValidationChange = useCallback((isValid: boolean, missingRequired: string[]) => {
    setSpecValidation({ isValid, missingRequired });
  }, []);

  // Compute merged specs using useMemo instead of useEffect + setState
  const mergedSpecs = useMemo(() => {
    // Only merge if editing, have initial specs, have category template, and not yet initialized
    if (isEditing && initialData?.specs && initialData.specs.length > 0 && categoryTemplate.length > 0 && !isSpecsInitialized) {
      // console.log('Merging specs with template...');
      
      // Create a map of existing specs for quick lookup (case-insensitive)
      const existingSpecsMap = new Map();
      initialData.specs.forEach(spec => {
        if (spec.key) {
          existingSpecsMap.set(normalizeKey(spec.key), spec);
        }
      });
      
      // Build specs from template, preserving existing values
      const merged: ProductSpec[] = [];
      
      for (const group of categoryTemplate) {
        for (const field of group.fields) {
          const normalizedKey = normalizeKey(field.key);
          const existingSpec = existingSpecsMap.get(normalizedKey);
          
          merged.push({
            key: field.key,
            label: field.label,
            value: existingSpec?.value !== undefined && existingSpec?.value !== null && existingSpec?.value !== ''
              ? existingSpec.value
              : normalizeDefaultValue(field.defaultValue, field.type || 'text'),
            group: group.groupName,
            unit: field.unit,
            filterable: field.filterable || false
          });
        }
      }
      
      return merged;
    }
    return null;
  }, [isEditing, initialData, categoryTemplate, isSpecsInitialized]);

  // Apply merged specs when they change - only once
  useEffect(() => {
    if (mergedSpecs && mergedSpecs.length > 0 && !isSpecsInitialized) {
      // console.log('Applying merged specs:', mergedSpecs);
      setSpecs(mergedSpecs);
      specsCache.current = mergedSpecs;
      setIsSpecsInitialized(true);
    }
  }, [mergedSpecs, isSpecsInitialized]);

  // Initialize for editing mode - set template only
  useEffect(() => {
    if (selectedCategory && categories.length > 0 && !isChangingCategory) {
      const category = categories.find(c => c._id === selectedCategory);
      if (category) {
        setCategoryTemplate(category.specificationTemplate || []);
      }
    }
    setIsInitializing(false);
  }, [selectedCategory, categories, isChangingCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      const flatCategories = Array.isArray(data) ? flattenCategories(data) : [];
      setCategories(flatCategories);

      // For editing: set selected category after categories are loaded
      if (isEditing && initialData?.formData.categoryId && !selectedCategory) {
        setSelectedCategory(initialData.formData.categoryId);
        setFormData(prev => ({ ...prev, categoryId: initialData.formData.categoryId || '' }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const flattenCategories = (categories: any[]): Category[] => {
    const flat: Category[] = [];
    categories.forEach(cat => {
      flat.push({
        _id: cat._id,
        name: cat.name,
        specificationTemplate: cat.specificationTemplate || []
      });
      if (cat.children && cat.children.length > 0) {
        flat.push(...flattenCategories(cat.children));
      }
    });
    return flat;
  };

  const handleCategoryChangeWithWarning = (categoryId: string) => {
    if (isEditing && specs.length > 0) {
      setPendingCategoryId(categoryId);
      setShowCategoryWarning(true);
    } else {
      handleCategoryChange(categoryId);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      let brandsList: Brand[] = [];

      if (data.success && Array.isArray(data.data)) {
        brandsList = data.data;
      } else if (Array.isArray(data)) {
        brandsList = data;
      }

      setBrands(brandsList);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const generateSlug = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateVariantKey = (attributes: VariantAttribute[]): string => {
    if (!attributes || attributes.length === 0) {
      return 'default';
    }
    const sorted = [...attributes].sort((a, b) => a.key.localeCompare(b.key));
    const keyString = sorted.map(attr => `${attr.key}:${attr.value}`).join('|');
    return keyString || 'default';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.brandId) {
      newErrors.brandId = 'Please select a brand';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.thumbnail) {
      newErrors.thumbnail = 'Please select a thumbnail image';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.shortDescription.trim() || formData.shortDescription.length < 10) {
      newErrors.shortDescription = 'Short description must be at least 10 characters';
    }

    if (!formData.description.trim() || formData.description.length < 50) {
      newErrors.description = 'Full description must be at least 50 characters';
    }

    // Use spec validation from component
    if (!specValidation.isValid && specValidation.missingRequired.length > 0) {
      newErrors.specs = `Missing required specifications: ${specValidation.missingRequired.join(', ')}`;
    }

    // Validate variants
    if (variants.length === 0) {
      newErrors.variants = 'At least one variant is required';
    } else {
      const invalidSKUVariants = variants.filter(v => !v.sku || v.sku.trim().length === 0);
      if (invalidSKUVariants.length > 0) {
        newErrors.variants = `Please provide SKUs for all variants. ${invalidSKUVariants.length} variant(s) missing SKU.`;
      }

      const invalidPriceVariants = variants.filter(v => v.price <= 0);
      if (invalidPriceVariants.length > 0) {
        newErrors.variants = `All variants must have a price greater than 0. ${invalidPriceVariants.length} variant(s) have invalid price.`;
      }

      const skus = variants.map(v => v.sku);
      const duplicateSKUs = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      if (duplicateSKUs.length > 0) {
        newErrors.variants = `Duplicate SKUs found: ${duplicateSKUs.join(', ')}. Please ensure all SKUs are unique.`;
      }
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

    const processedVariants = variants.map((variant) => ({
      ...variant,
      variantKey: variant.variantKey && variant.variantKey !== ''
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
        if (data.warnings && data.warnings.length > 0) {
          setToast({
            message: `Product saved with warnings:\n${data.warnings.join('\n')}`,
            type: 'warning'
          });
        } else {
          setToast({
            message: `Product ${isEditing ? 'updated' : 'created'} successfully!`,
            type: 'success'
          });
        }

        onSuccess?.();
        router.push('/admin/products');
        router.refresh();
      } else {
        setErrors({ submit: data.error || `Failed to ${isEditing ? 'update' : 'create'} product` });
        setToast({
          message: data.error || `Failed to ${isEditing ? 'update' : 'create'} product`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} product:`, error);
      setErrors({ submit: 'An error occurred. Please try again.' });
      setToast({
        message: 'An error occurred. Please try again.',
        type: 'error'
      });
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
        setToast({ message: 'Product deleted successfully!', type: 'success' });
        router.push('/admin/products');
        router.refresh();
      } else {
        const data = await res.json();
        setErrors({ delete: data.error || 'Failed to delete product' });
        setToast({ message: data.error || 'Failed to delete product', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrors({ delete: 'An error occurred. Please try again.' });
      setToast({ message: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleImagesUpdate = useCallback((newImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  }, []);

  const handleThumbnailChange = useCallback((thumbnailUrl: string) => {
    setFormData(prev => ({
      ...prev,
      thumbnail: thumbnailUrl
    }));
    if (errors.thumbnail) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.thumbnail;
        return newErrors;
      });
    }
  }, [errors.thumbnail]);

  const variantAttributes = categoryTemplate.flatMap(group =>
    group.fields.filter(f => f.isVariantAttribute).map(f => f.key)
  );

  // Loading state
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
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`rounded-lg border p-4 shadow-lg max-w-md ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium whitespace-pre-line">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4" ref={(el) => { errorRefs.current['error-summary'] = el; }}>
            <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Please fix the following errors:
            </h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete Confirmation Modal */}
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

        {/* Category Change Warning Modal */}
        {showCategoryWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Warning: Category Change
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Changing the category will reset all product specifications to match the new category template.
                Any existing specification data will be lost. Are you sure you want to continue?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryWarning(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryChange(pendingCategoryId);
                    setShowCategoryWarning(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Yes, Change Category
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
          {/* Basic Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6" ref={(el) => { errorRefs.current['basic-info'] = el; }}>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Product Name */}
              <div ref={(el) => { errorRefs.current['name'] = el; }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Premium Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({ ...formData, name: newName });
                    if (!formData.slug || (!isEditing && !formData.slug)) {
                      const newSlug = generateSlug(newName);
                      setFormData(prev => ({ ...prev, name: newName, slug: newSlug }));
                    }
                    if (errors.name) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="auto-generated from name"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {isEditing ? 'URL-friendly identifier.' : 'URL-friendly identifier. Leave empty to auto-generate.'}
                </p>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div ref={(el) => { errorRefs.current['categoryId'] = el; }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChangeWithWarning(e.target.value)}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${errors.categoryId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                  {selectedCategory && !isEditing && (
                    <p className="mt-1 text-xs text-green-600">✓ Category template loaded. Specifications will appear below.</p>
                  )}
                </div>

                <div ref={(el) => { errorRefs.current['brandId'] = el; }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${errors.brandId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a brand...</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                  {errors.brandId && <p className="mt-1 text-xs text-red-500">{errors.brandId}</p>}
                </div>
              </div>

              {/* Short Description */}
              <div ref={(el) => { errorRefs.current['shortDescription'] = el; }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief description (10-500 characters)"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${errors.shortDescription ? 'border-red-500' : ''}`}
                />
                {errors.shortDescription && <p className="mt-1 text-xs text-red-500">{errors.shortDescription}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Used in product listings and search results. Minimum 10 characters.
                </p>
              </div>

              {/* Full Description */}
              <div ref={(el) => { errorRefs.current['description'] = el; }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Detailed product description (50-5000 characters)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                <p className="mt-1 text-xs text-gray-500">Minimum 50 characters. Provide detailed information about the product.</p>
              </div>
            </div>
          </div>

          {/* Product Specifications Section */}
          {selectedCategory && categoryTemplate.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6" ref={(el) => { errorRefs.current['specs'] = el; }}>
              <div className="flex items-start gap-2 mb-4">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Product Specifications</h2>
                  <p className="text-sm text-gray-500">
                    These specifications are defined by the selected category.
                    {!isEditing && ' Required fields are marked. Specifications marked as "variant attribute" will be used to create product variants.'}
                  </p>
                </div>
              </div>

              <ProductSpecForm
                key={`specs-${selectedCategory}-${categoryVersion}`}
                groups={categoryTemplate}
                specs={specs as any}
                onChange={setSpecs as any}
                onValidationChange={handleSpecValidationChange}
              />
              {errors.specs && <p className="mt-2 text-sm text-red-500">{errors.specs}</p>}
            </div>
          )}

          {/* Product Variants Section */}
          {selectedCategory && variantAttributes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6" ref={(el) => { errorRefs.current['variants'] = el; }}>
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

              <ProductVariantManager
                key={`variants-${selectedCategory}-${variants.length}`}
                variants={variants}
                onChange={setVariants}
                variantAttributes={variantAttributes}
              />
              {errors.variants && <p className="mt-2 text-sm text-red-500">{errors.variants}</p>}
            </div>
          )}

          {/* Media Section */}
          <div className="bg-white rounded-lg shadow-sm p-6" ref={(el) => { errorRefs.current['thumbnail'] = el; }}>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Media</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Select which image will be the main product thumbnail. Click "Set as Thumbnail" on any image below.
              </p>

              {formData.thumbnail && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-amber-500 mb-4">
                  <NextImage
                    src={formData.thumbnail}
                    alt="Thumbnail"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              {errors.thumbnail && <p className="mt-1 text-xs text-red-500">{errors.thumbnail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Images</label>
              <ImageUploader
                images={formData.images}
                onUpload={handleImagesUpdate}
                onThumbnailChange={handleThumbnailChange}
                thumbnail={formData.thumbnail}
                maxImages={10}
              />
            </div>
          </div>

          {/* Tags & Status Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  placeholder="e.g., wireless, premium, headphones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' | 'archived' })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                >
                  <option value="draft">Draft (Not visible to customers)</option>
                  <option value="active">Active (Visible to customers)</option>
                  <option value="archived">Archived (Hidden)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
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