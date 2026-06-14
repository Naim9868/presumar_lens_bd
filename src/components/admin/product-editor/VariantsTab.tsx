// src/components/admin/product-editor/VariantsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useForm,  type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Trash2, Copy, RefreshCw, ChevronDown, ChevronUp, X,
  Package, DollarSign, Layers, AlertCircle, CheckCircle,
  Zap, Star
} from 'lucide-react';
import { generateSKU } from '@/lib/utils';

const variantAttributeSchema = z.object({
  key: z.string().min(1, 'Attribute key is required'),
  value: z.string().min(1, 'Attribute value is required'),
});

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  attributes: z.array(variantAttributeSchema),
  price: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z.number().min(0).optional(),
  inventory: z.number().min(0).default(0),
  reserved: z.number().min(0).default(0),
  images: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  status: z.enum(['in_stock', 'out_of_stock', 'discontinued']).default('in_stock'),
});

const variantsTabSchema = z.object({
  variants: z.array(variantSchema).default([]),
});

type VariantsFormData = z.infer<typeof variantsTabSchema>;

interface VariantsTabProps {
  initialData?: { variants?: any[] };
  onDataChange?: (data: any) => void;
}

interface AttributeOption {
  key: string;
  values: string[];
  rawValue: string;
}

export default function VariantsTab({ initialData, onDataChange }: VariantsTabProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set());

  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<VariantsFormData>({
    resolver: zodResolver(variantsTabSchema) as unknown as Resolver<VariantsFormData>,
    defaultValues: initialData || {
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const variants = watch('variants');

  useEffect(() => {
    const subscription = watch((value) => {
      onDataChange?.(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  const toggleExpand = (index: number) => {
    const newSet = new Set(expandedVariants);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedVariants(newSet);
  };

  const addVariant = () => {
    append({
      sku: generateSKU(),
      attributes: [],
      price: 0,
      compareAtPrice: 0,
      inventory: 0,
      reserved: 0,
      images: [],
      isDefault: variants.length === 0,
      status: 'in_stock',
    });
    setExpandedVariants(new Set([fields.length]));
  };

  const duplicateVariant = (index: number) => {
    const variant = getValues(`variants.${index}`);
    append({
      ...variant,
      sku: generateSKU(),
      isDefault: false,
    });
    setExpandedVariants(new Set([fields.length]));
  };

  const removeVariant = (index: number) => {
    if (fields.length === 0) return;
    remove(index);
    const remainingVariants = getValues('variants');
    if (remainingVariants.length > 0 && !remainingVariants.some((v: any) => v.isDefault)) {
      setValue(`variants.0.isDefault`, true);
    }
  };

  const setDefaultVariant = (index: number) => {
    fields.forEach((_, i) => {
      setValue(`variants.${i}.isDefault`, i === index);
    });
  };

  const addAttributeOption = () => {
    setAttributeOptions([...attributeOptions, { key: '', values: [], rawValue: '' }]);
  };

  const updateAttributeKey = (index: number, key: string) => {
    const newOptions = [...attributeOptions];
    newOptions[index].key = key;
    setAttributeOptions(newOptions);
  };

  const updateAttributeValues = (index: number, valuesString: string) => {
    const newOptions = [...attributeOptions];
    // Always update the raw input value in the option for display
    newOptions[index].rawValue = valuesString;
    
    // Parse values when there's a comma
    if (valuesString.includes(',')) {
      const values = valuesString.split(',').map(v => v.trim()).filter(v => v);
      newOptions[index].values = values;
    } else if (!valuesString) {
      newOptions[index].values = [];
    }
    setAttributeOptions(newOptions);
  };

  const removeAttributeOption = (index: number) => {
    setAttributeOptions(attributeOptions.filter((_, i) => i !== index));
  };

  const generateVariants = () => {
    const validOptions = attributeOptions.filter(opt => opt.key && opt.values.length > 0);
    if (validOptions.length === 0) {
      alert('Please add at least one attribute with values');
      return;
    }

    const combinations = generateCombinations(validOptions);
    
    const newVariants = combinations.map((combo, idx) => ({
      sku: generateSKU(),
      attributes: combo,
      price: 0,
      compareAtPrice: 0,
      inventory: 0,
      reserved: 0,
      images: [],
      isDefault: idx === 0 && variants.length === 0,
      status: 'in_stock' as const,
    }));

    newVariants.forEach((variant) => {
      append(variant);
    });

    setShowGenerator(false);
    setAttributeOptions([]);
    setExpandedVariants(new Set(Array.from({ length: fields.length + newVariants.length }, (_, i) => i)));
  };

  const generateCombinations = (options: AttributeOption[]): Array<{ key: string; value: string }[]> => {
    if (options.length === 0) return [];
    
    const [first, ...rest] = options;
    const combinations = first.values.map(value => [{ key: first.key, value }]);
    
    for (const option of rest) {
      const newCombinations: Array<{ key: string; value: string }[]> = [];
      for (const combo of combinations) {
        for (const value of option.values) {
          newCombinations.push([...combo, { key: option.key, value }]);
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }
    
    return combinations;
  };

  const bulkUpdatePrices = (price: number) => {
    fields.forEach((_, index) => {
      setValue(`variants.${index}.price`, price);
    });
  };

  const bulkUpdateInventory = (inventory: number) => {
    fields.forEach((_, index) => {
      setValue(`variants.${index}.inventory`, inventory);
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'in_stock':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'In Stock', icon: CheckCircle };
      case 'out_of_stock':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Out of Stock', icon: AlertCircle };
      case 'discontinued':
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Discontinued', icon: X };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown', icon: Package };
    }
  };

  const totalInventory = variants?.reduce((sum, v) => sum + (v.inventory || 0), 0) || 0;
  const minPrice = variants?.length > 0 ? Math.min(...(variants?.map(v => v.price || 0) || [0])) : 0;
  const maxPrice = variants?.length > 0 ? Math.max(...(variants?.map(v => v.price || 0) || [0])) : 0;

  // Empty State - Show when no variants exist
  if (fields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                <p className="text-sm text-gray-500">Add different versions of your product (size, color, material, etc.)</p>
              </div>
            </div>
          </div>
          
          <div className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <Package className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variants Added Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Start by adding your first product variant. You can add variants manually or use the variant generator for combinations of attributes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={addVariant}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add First Variant
              </button>
              <button
                type="button"
                onClick={() => setShowGenerator(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Use Variant Generator
              </button>
            </div>
          </div>
        </div>

        {/* Variant Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <RefreshCw className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Variant Generator</h3>
                    <p className="text-sm text-gray-500">Create variants from attribute combinations</p>
                  </div>
                </div>
                <button onClick={() => setShowGenerator(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                {attributeOptions.map((opt, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Attribute (e.g., Color, Size)"
                        value={opt.key}
                        onChange={(e) => updateAttributeKey(idx, e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeAttributeOption(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Values (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Red, Blue, Green"
                        value={(opt as any).rawValue || opt.values.join(', ')}
                        onChange={(e) => updateAttributeValues(idx, e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Separate values with commas. Example: "Red, Blue, Green" will create 3 options
                      </p>
                    </div>

                    {opt.values.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {opt.values.map((value, vIdx) => (
                          <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addAttributeOption}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-all font-medium"
                >
                  + Add Attribute
                </button>
                
                {attributeOptions.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <p className="text-sm text-purple-700 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      This will generate {attributeOptions.reduce((acc, opt) => acc * (opt.values.length || 1), 1)} variant combination(s)
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowGenerator(false);
                      setAttributeOptions([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateVariants}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-medium"
                  >
                    Generate Variants
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main view with variants list (when variants exist)
  return (
    <div className="space-y-6">
      {/* Header Stats Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-purple-600 font-medium">Total Variants</div>
            <div className="text-2xl font-bold text-purple-900">{fields.length}</div>
          </div>
          <div>
            <div className="text-sm text-purple-600 font-medium">Total Inventory</div>
            <div className="text-2xl font-bold text-purple-900">{totalInventory}</div>
          </div>
          <div>
            <div className="text-sm text-purple-600 font-medium">Price Range</div>
            <div className="text-lg font-bold text-purple-900">
              ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-purple-600 font-medium">Default SKU</div>
            <div className="text-sm font-mono font-semibold text-purple-900 truncate">
              {variants?.find(v => v.isDefault)?.sku || 'None set'}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={addVariant}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Variant
          </button>
          <button
            type="button"
            onClick={() => setShowGenerator(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Variant Generator
          </button>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              const price = prompt('Enter price for all variants:');
              if (price) bulkUpdatePrices(parseFloat(price));
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <DollarSign className="w-4 h-4" />
            Bulk Set Price
          </button>
          <button
            type="button"
            onClick={() => {
              const inventory = prompt('Enter inventory for all variants:');
              if (inventory) bulkUpdateInventory(parseInt(inventory));
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Package className="w-4 h-4" />
            Bulk Set Inventory
          </button>
        </div>
      </div>

      {/* Variants List */}
      <div className="space-y-3">
        {fields.map((field, index) => {
          const variant = variants?.[index];
          const isExpanded = expandedVariants.has(index);
          const statusConfig = getStatusConfig(variant?.status || 'in_stock');
          const StatusIcon = statusConfig.icon;
          const discount = variant?.compareAtPrice && variant?.price && variant.compareAtPrice > variant.price
            ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100)
            : 0;
          
          return (
            <div key={field.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Variant Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(index)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {variant?.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                      {variant?.sku}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {variant?.attributes?.map((attr: any, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                        {attr.key}: {attr.value}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        ${variant?.price?.toFixed(2) || '0.00'}
                      </div>
                      {discount > 0 && (
                        <div className="text-xs text-green-600">-{discount}%</div>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      Stock: {variant?.inventory || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateVariant(index)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Variant Details */}
              {isExpanded && (
                <div className="p-5 space-y-5">
                  {/* Attributes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Attributes
                    </label>
                    <div className="space-y-2">
                      {variant?.attributes?.map((attr: any, attrIndex: number) => (
                        <div key={attrIndex} className="flex gap-2">
                          <input
                            {...register(`variants.${index}.attributes.${attrIndex}.key`)}
                            placeholder="Key (e.g., Color)"
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                          />
                          <input
                            {...register(`variants.${index}.attributes.${attrIndex}.value`)}
                            placeholder="Value (e.g., Red)"
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentAttrs = getValues(`variants.${index}.attributes`);
                              if (currentAttrs.length > 1) {
                                setValue(`variants.${index}.attributes`, currentAttrs.filter((_, i) => i !== attrIndex));
                              } else {
                                alert('Variant must have at least one attribute');
                              }
                            }}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const currentAttrs = getValues(`variants.${index}.attributes`) || [];
                          setValue(`variants.${index}.attributes`, [...currentAttrs, { key: '', value: '' }]);
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Attribute
                      </button>
                    </div>
                  </div>
                  
                  {/* Pricing & Inventory */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`variants.${index}.price`, { valueAsNumber: true })}
                          className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Compare at Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`variants.${index}.compareAtPrice`, { valueAsNumber: true })}
                          className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Inventory
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          {...register(`variants.${index}.inventory`, { valueAsNumber: true })}
                          className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        {...register(`variants.${index}.status`)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Default Variant Toggle */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      checked={variant?.isDefault}
                      onChange={() => setDefaultVariant(index)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Set as default variant (shown first on product page)
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Variant Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Variant Generator</h3>
                  <p className="text-sm text-gray-500">Create variants from attribute combinations</p>
                </div>
              </div>
              <button onClick={() => setShowGenerator(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {attributeOptions.map((opt, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Attribute (e.g., Color, Size)"
                      value={opt.key}
                      onChange={(e) => updateAttributeKey(idx, e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeAttributeOption(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Values (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Red, Blue, Green"
                      value={(opt as any).rawValue || opt.values.join(', ')}
                      onChange={(e) => updateAttributeValues(idx, e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Separate values with commas. Example: "Red, Blue, Green" will create 3 options
                    </p>
                  </div>

                  {opt.values.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {opt.values.map((value, vIdx) => (
                        <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                          {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addAttributeOption}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-all font-medium"
              >
                + Add Attribute
              </button>
              
              {attributeOptions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    This will generate {attributeOptions.reduce((acc, opt) => acc * (opt.values.length || 1), 1)} variant combination(s)
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowGenerator(false);
                    setAttributeOptions([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={generateVariants}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-medium"
                >
                  Generate Variants
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}