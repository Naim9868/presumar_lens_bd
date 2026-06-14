// src/components/admin/product-editor/GeneralTab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, FieldError,  type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Trash2, ChevronDown, ChevronUp, DollarSign, Package,
  AlertCircle, Info, Tag, Building2, FolderTree, FileText,
  Sparkles, TrendingUp, Shield, Award, Globe, Hash, Layers,
  Eye, EyeOff
} from 'lucide-react';
import { getCategories } from '@/app/actions/category/getCategories';
import { getBrands } from '@/app/actions/brand/getBrands';
import { Brand, Category } from '@/types';

// Define types for specifications
interface Specification {
  key: string;
  label: string;
  value: string | number | boolean | string[];
  unit?: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  filterable: boolean;
}

interface SpecificationGroup {
  groupName: string;
  displayOrder: number;
  specifications: Specification[];
}

interface GeneralFormData {
  name: string;
  description: string;
  shortDescription: string;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  status: 'draft' | 'active' | 'archived';
  specificationGroups: SpecificationGroup[];
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
  hasVariants: boolean;
}

const specificationSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  label: z.string().min(1, 'Label is required'),
  value: z.any(),
  unit: z.string().optional(),
  type: z.enum(['text', 'textarea', 'number', 'boolean', 'date', 'select', 'multiselect']).default('text'),
  filterable: z.boolean().default(false),
});

const specificationGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  displayOrder: z.number().default(0),
  specifications: z.array(specificationSchema),
});

const generalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  specificationGroups: z.array(specificationGroupSchema).default([]),
  price: z.number().min(0, 'Price must be positive').optional(),
  compareAtPrice: z.number().min(0).optional(),
  inventory: z.number().min(0).default(0).optional(),
  hasVariants: z.boolean().default(false),
}).refine((data) => {
  if (!data.hasVariants && data.price === undefined) {
    return false;
  }
  return true;
}, {
  message: 'Price is required when not using variants',
  path: ['price'],
});

interface GeneralTabProps {
  initialData?: Partial<GeneralFormData>;
  onDataChange?: (data: GeneralFormData) => void;
  onHasVariantsChange?: (hasVariants: boolean) => void;
}

// Helper function to generate key from label
const generateKeyFromLabel = (label: string): string => {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export default function GeneralTab({ initialData, onDataChange, onHasVariantsChange }: GeneralTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  const [showKeyFields, setShowKeyFields] = useState<Record<string, boolean>>({});

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<GeneralFormData>({
   resolver: zodResolver(generalSchema) as unknown as Resolver<GeneralFormData>,
    defaultValues: {
      status: 'draft',
      specificationGroups: [],
      hasVariants: false,
      inventory: 0,
      price: 0,
      compareAtPrice: 0,
      ...initialData,
    },
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: 'specificationGroups',
  });

  const selectedCategoryId = watch('categoryId');
  const specificationGroups = watch('specificationGroups');
  const hasVariants = watch('hasVariants');
  const price = watch('price');
  const compareAtPrice = watch('compareAtPrice');
  const inventory = watch('inventory');

  // Handle auto-generation of key from label
//  const handleLabelChange = (
//   groupIndex: number,
//   specIndex: number,
//   label: string
// ) => {
//   const keyPath =
//     `specificationGroups.${groupIndex}.specifications.${specIndex}.key`;

//   setTimeout(() => {
//     const currentKey = getValues(keyPath);

//     if (!currentKey || currentKey === '') {
//       setValue(
//         keyPath,
//         generateKeyFromLabel(label),
//         {
//           shouldDirty: true,
//           shouldTouch: true,
//         }
//       );
//     }
//   }, 0);
// };

  const toggleKeyField = (groupIndex: number, specIndex: number) => {
    const fieldKey = `${groupIndex}-${specIndex}`;

    setShowKeyFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  useEffect(() => {
    const subscription = watch((value) => {
      if (onDataChange && value) {
        onDataChange(value as GeneralFormData);
      }
      if (onHasVariantsChange) {
        onHasVariantsChange(value.hasVariants || false);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange, onHasVariantsChange]);

  useEffect(() => {
    async function loadData() {
      const [categoriesData, brandsData] = await Promise.all([
        getCategories({ status: 'active' }),
        getBrands({ isActive: true }),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadSubcategories() {
      if (selectedCategoryId) {
        const subs = await getCategories({ parentId: selectedCategoryId, status: 'active' });
        setSubcategories(subs);
      } else {
        setSubcategories([]);
      }
    }
    loadSubcategories();
  }, [selectedCategoryId]);

const handleDataChange = useCallback((data: GeneralFormData) => {
  const processedData: GeneralFormData = {
    ...data,

    subcategoryId:
      data.subcategoryId === ''
        ? undefined
        : data.subcategoryId,

    specificationGroups:
      (data.specificationGroups || []).map(group => ({
        ...group,

        specifications:
          (group.specifications || []).map(spec => ({
            ...spec,

            key:
              spec.key?.trim()
                ? spec.key
                : generateKeyFromLabel(spec.label),
          })),
      })),
  };

  if (!processedData.hasVariants) {
    processedData.price ??= 0;
    processedData.compareAtPrice ??= 0;
    processedData.inventory ??= 0;
  }

  onDataChange?.(processedData);
}, [onDataChange]);


  useEffect(() => {
    const subscription = watch((value) => {
      if (value) {
        handleDataChange(value as GeneralFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, handleDataChange]);

  const addSpecificationGroup = () => {
    appendGroup({
      groupName: '',
      displayOrder: groupFields.length,
      specifications: [],
    });
    setExpandedGroups(new Set([groupFields.length]));
  };

  const addSpecification = (groupIndex: number) => {
    const currentSpecs = getValues(`specificationGroups.${groupIndex}.specifications`) || [];
    setValue(`specificationGroups.${groupIndex}.specifications`, [
      ...currentSpecs,
      {
        key: '',
        label: '',
        value: '',
        unit: '',
        type: 'text',
        filterable: false,
      },
    ]);
  };

  const removeSpecification = (groupIndex: number, specIndex: number) => {
    const currentSpecs = getValues(`specificationGroups.${groupIndex}.specifications`);
    const newSpecs = currentSpecs.filter((_, i) => i !== specIndex);
    setValue(`specificationGroups.${groupIndex}.specifications`, newSpecs);
  };

  const toggleGroupExpand = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const renderSpecificationValueInput = (groupIndex: number, specIndex: number, type: string) => {
    const fieldName = `specificationGroups.${groupIndex}.specifications.${specIndex}.value` as const;

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...register(fieldName)}
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
            placeholder="Enter value"
          />
        );
      case 'number':
        return (
          <input
            {...register(fieldName, { valueAsNumber: true })}
            type="number"
            step="any"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
            placeholder="Enter number"
          />
        );
      case 'boolean':
        return (
          <select
            {...register(fieldName)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case 'date':
        return (
          <input
            {...register(fieldName)}
            type="date"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
          />
        );
      default:
        return (
          <input
            {...register(fieldName)}
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
            placeholder="Enter value"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const getErrorMessage = (error: FieldError | undefined) => {
    return error?.message ? (
      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error.message}
      </p>
    ) : null;
  };

  const discountPercentage = compareAtPrice && price && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-500">Essential product details</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
              placeholder="Enter product name"
            />
            {getErrorMessage(errors.name)}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('shortDescription')}
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all resize-none"
              placeholder="Brief description for product listings"
            />
            {getErrorMessage(errors.shortDescription)}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all resize-none"
              placeholder="Detailed product description"
            />
            {getErrorMessage(errors.description)}
          </div>
        </div>
      </div>

      {/* Pricing & Inventory Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-green-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
                <p className="text-sm text-gray-500">Set your product pricing and stock</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-purple-50 rounded-full">
              <input
                type="checkbox"
                {...register('hasVariants')}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-purple-700">Has Variants</span>
            </label>
          </div>
        </div>

        <div className="p-6">
          {hasVariants ? (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Variant Pricing Active</p>
                  <p className="text-sm text-purple-700 mt-1">
                    This product uses variants. Go to the <strong className="text-purple-900">Variants Tab</strong> to set prices and inventory for each variant.
                  </p>
                  <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Add variants like size, color, material with individual prices and stock levels
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0.00"
                  />
                </div>
                {getErrorMessage(errors.price)}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Compare at Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    {...register('compareAtPrice', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0.00"
                  />
                </div>
                {discountPercentage > 0 && (
                  <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Save {discountPercentage}% - Customers see original price crossed out
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inventory Quantity
                </label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('inventory', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all"
                    placeholder="0"
                  />
                </div>
                {inventory !== undefined && inventory <= 5 && inventory > 0 && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Low stock: Only {inventory} units left
                  </p>
                )}
                {inventory === 0 && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Out of stock - Product will be marked as unavailable
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Summary</span>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Price:</span>
                    <span className="font-semibold text-gray-900">
                      ${(price || 0).toFixed(2)}
                    </span>
                  </div>
                  {compareAtPrice && compareAtPrice > (price || 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Price:</span>
                      <span className="text-gray-400 line-through">
                        ${compareAtPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Available Stock:</span>
                    <span className={`font-semibold ${inventory === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {inventory || 0} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Organization Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
              <p className="text-sm text-gray-500">Categorize your product</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                {...register('brandId')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
              >
                <option value="">Select brand</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>{brand.name}</option>
                ))}
              </select>
              {getErrorMessage(errors.brandId)}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('categoryId')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {getErrorMessage(errors.categoryId)}
            </div>

            {subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  {...register('subcategoryId')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
                >
                  <option value="">Select subcategory</option>
                  {subcategories.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-orange-50 to-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Layers className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
                <p className="text-sm text-gray-500">Technical details and attributes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addSpecificationGroup}
              className="px-4 py-2 text-sm bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Group
            </button>
          </div>
        </div>

        <div className="p-6">
          {groupFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No specification groups yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Group" to create product specifications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupFields.map((group, groupIndex) => (
                <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleGroupExpand(groupIndex)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {expandedGroups.has(groupIndex) ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <input
                          {...register(`specificationGroups.${groupIndex}.groupName`)}
                          type="text"
                          placeholder="Group Name (e.g., Technical Specs, Dimensions)"
                          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGroup(groupIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {errors.specificationGroups?.[groupIndex]?.groupName && (
                      <p className="mt-2 text-sm text-red-500">
                        {errors.specificationGroups[groupIndex].groupName.message}
                      </p>
                    )}
                  </div>

                  {expandedGroups.has(groupIndex) && (
                    <div className="p-5">
                      <div className="space-y-3">
                        {specificationGroups?.[groupIndex]?.specifications?.map((_, specIndex) => {
                          const keyFieldId = `${groupIndex}-${specIndex}`;
                          const showKey = showKeyFields[keyFieldId];

                          return (
                            <div key={specIndex} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div className="relative">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Label *
                                  </label>
                                  <input
                                    {...register(
                                      `specificationGroups.${groupIndex}.specifications.${specIndex}.label`,
                                      { required: 'Label is required' }
                                    )}
                                    type="text"
                                    placeholder="e.g., Processor, Screen Size"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8"
                                  />
                                  {/* <button
                                    type="button"
                                    onClick={() => toggleKeyField(groupIndex, specIndex)}
                                    className="absolute right-2 top-7 text-gray-400 hover:text-gray-600"
                                    title={showKey ? "Hide key field" : "Show key field"}
                                  >
                                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button> */}
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Value *
                                  </label>
                                  {renderSpecificationValueInput(
                                    groupIndex,
                                    specIndex,
                                    specificationGroups[groupIndex].specifications[specIndex]?.type || 'text'
                                  )}
                                </div>
                              </div>

                              {showKey && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  {/* <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                      Key (identifier)
                                    </label>
                                    <input
                                      {...register(
                                        `specificationGroups.${groupIndex}.specifications.${specIndex}.key`
                                      )}
                                      type="text"
                                      placeholder="processor"
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Auto-generated from label if left empty</p>
                                  </div> */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                      Type
                                    </label>
                                    <select
                                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.type`)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                      <option value="text">Text</option>
                                      <option value="textarea">Multi-line Text</option>
                                      <option value="number">Number</option>
                                      <option value="boolean">Yes/No</option>
                                      <option value="date">Date</option>
                                      <option value="select">Select</option>
                                      <option value="multiselect">Multi-select</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {!showKey && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                      Type
                                    </label>
                                    <select
                                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.type`)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                      <option value="text">Text</option>
                                      <option value="textarea">Multi-line Text</option>
                                      <option value="number">Number</option>
                                      <option value="boolean">Yes/No</option>
                                      <option value="date">Date</option>
                                      <option value="select">Select</option>
                                      <option value="multiselect">Multi-select</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                      Unit (optional)
                                    </label>
                                    <input
                                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.unit`)}
                                      type="text"
                                      placeholder="e.g., GHz, inches, mm"
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {showKey && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                      Unit (optional)
                                    </label>
                                    <input
                                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.unit`)}
                                      type="text"
                                      placeholder="e.g., GHz, inches, mm"
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                  </div>
                                )}
                                <div className={!showKey ? "col-span-2" : ""}>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      {...register(`specificationGroups.${groupIndex}.specifications.${specIndex}.filterable`)}
                                      type="checkbox"
                                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">Filterable in storefront</span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
                                <button
                                  type="button"
                                  onClick={() => removeSpecification(groupIndex, specIndex)}
                                  className="text-sm text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Remove Specification
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => addSpecification(groupIndex)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-all font-medium"
                        >
                          + Add Specification
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}