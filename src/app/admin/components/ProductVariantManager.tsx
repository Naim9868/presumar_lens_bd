// app/admin/components/ProductVariantManager.tsx
'use client';

import { useState } from 'react';
import { X, Plus, Copy, Sparkles } from 'lucide-react';

interface VariantAttribute {
  key: string;
  value: string;
}

interface ProductVariant {
  sku: string;
  variantKey?: string;
  attributes: VariantAttribute[];
  price: number;
  compareAtPrice?: number;
  inventory: number;
  reserved?: number;
  weight?: number;
  images?: string[];
  isDefault: boolean;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  variantAttributes: string[];
  readOnly?: boolean;
}

export function ProductVariantManager({ 
  variants, 
  onChange, 
  variantAttributes, 
  readOnly = false 
}: ProductVariantManagerProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [attributeCombinations, setAttributeCombinations] = useState<Record<string, string[]>>({});

  // Generate a unique SKU based on attributes
  const generateSKU = (attributes: VariantAttribute[], index: number): string => {
    const attrString = attributes
      .filter(attr => attr.value)
      .map(attr => attr.value.substring(0, 3).toUpperCase())
      .join('-');
    
    const baseSKU = attrString ? `VAR-${attrString}` : `VAR-${Date.now()}`;
    const uniqueSuffix = index > 0 ? `-${index}` : '';
    
    return `${baseSKU}${uniqueSuffix}`;
  };

  const addVariant = () => {
    const newAttributes = variantAttributes.map(attr => ({ key: attr, value: '' }));
    const newVariant: ProductVariant = {
      sku: generateSKU(newAttributes, variants.length),
      attributes: newAttributes,
      price: 0,
      inventory: 0,
      isDefault: variants.length === 0,
      status: 'in_stock'
    };
    onChange([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    if (newVariants.length > 0 && variants[index].isDefault) {
      newVariants[0].isDefault = true;
    }
    onChange(newVariants);
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...updates };
    
    // Auto-generate SKU if attributes changed and SKU is empty or auto-generated
    if (updates.attributes) {
      const currentSKU = newVariants[index].sku;
      if (!currentSKU || currentSKU.startsWith('VAR-')) {
        newVariants[index].sku = generateSKU(updates.attributes, index);
      }
    }
    
    onChange(newVariants);
  };

  const generateVariants = () => {
    // Generate all combinations of attributes
    const attributeKeys = Object.keys(attributeCombinations);
    const combinations = attributeKeys.reduce((acc, key) => {
      const values = attributeCombinations[key];
      if (acc.length === 0) {
        return values.map(v => ({ [key]: v }));
      }
      return acc.flatMap(item => values.map(v => ({ ...item, [key]: v })));
    }, [] as Record<string, string>[]);

    const newVariants = combinations.map((combo, idx) => {
      const attributes = Object.entries(combo).map(([key, value]) => ({ key, value }));
      return {
        sku: generateSKU(attributes, variants.length + idx),
        attributes: attributes,
        price: 0,
        inventory: 0,
        isDefault: idx === 0 && variants.length === 0,
        status: 'in_stock' as const
      };
    });

    onChange([...variants, ...newVariants]);
    setShowGenerator(false);
    setAttributeCombinations({});
  };

  const updateAttributeCombination = (key: string, values: string) => {
    setAttributeCombinations({
      ...attributeCombinations,
      [key]: values.split(',').map(v => v.trim()).filter(v => v)
    });
  };

  const copyVariant = (index: number) => {
    const variantToCopy = variants[index];
    const newVariant = {
      ...variantToCopy,
      sku: `${variantToCopy.sku}-COPY`,
      isDefault: false
    };
    onChange([...variants, newVariant]);
  };

  // Validate if all variants have SKU
  const hasValidSKUs = variants.every(variant => variant.sku && variant.sku.trim().length > 0);
  const hasValidPrices = variants.every(variant => variant.price > 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-500">
            Variants allow you to sell the same product in different options like size, color, or material.
            Each variant must have a unique SKU and price greater than 0.
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Generate Variants
            </button>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Variant
            </button>
          </div>
        )}
      </div>

      {/* Validation Warnings */}
      {!readOnly && variants.length > 0 && (
        <div className="space-y-2">
          {!hasValidSKUs && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Some variants are missing SKUs. Please provide unique SKUs for all variants.
              </p>
            </div>
          )}
          {!hasValidPrices && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Some variants have price 0 or invalid price. Please set a price greater than 0 for all variants.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Variant Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Generate Variants</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter values for each attribute separated by commas. Variants will be created for all combinations.
              SKUs will be auto-generated based on attribute values.
            </p>
            {variantAttributes.map((attr, idx) => (
              <div key={`generator-${attr}-${idx}`} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {attr}
                </label>
                <input
                  type="text"
                  placeholder="e.g., Red, Blue, Green"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => updateAttributeCombination(attr, e.target.value)}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGenerator(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateVariants}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variants Table */}
      {variants.length > 0 ? (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU *</th>
                {variantAttributes.map((attr, idx) => (
                  <th key={`header-${attr}-${idx}`} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {attr}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price *</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compare At</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {!readOnly && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant, idx) => {
                const isSkuInvalid = !variant.sku || variant.sku.trim().length === 0;
                const isPriceInvalid = variant.price <= 0;
                
                return (
                  <tr key={`variant-row-${idx}`} className={variant.isDefault ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="radio"
                        checked={variant.isDefault}
                        onChange={() => {
                          const newVariants = variants.map((v, i) => ({
                            ...v,
                            isDefault: i === idx
                          }));
                          onChange(newVariants);
                        }}
                        disabled={readOnly}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(idx, { sku: e.target.value.toUpperCase() })}
                        placeholder="Enter unique SKU"
                        disabled={readOnly}
                        className={`w-32 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                          isSkuInvalid && !readOnly ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      {isSkuInvalid && !readOnly && (
                        <p className="text-xs text-red-500 mt-1">SKU is required</p>
                      )}
                    </td>
                    {variantAttributes.map((attr, attrIdx) => {
                      const attrValue = variant.attributes.find(a => a.key === attr)?.value || '';
                      return (
                        <td key={`${idx}-${attr}-${attrIdx}`} className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={attrValue}
                            onChange={(e) => {
                              const updatedAttributes = variant.attributes.map(a =>
                                a.key === attr ? { ...a, value: e.target.value } : a
                              );
                              updateVariant(idx, { attributes: updatedAttributes });
                            }}
                            placeholder={attr}
                            disabled={readOnly}
                            className="w-28 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(idx, { price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        disabled={readOnly}
                        className={`w-24 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                          isPriceInvalid && !readOnly ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      {isPriceInvalid && !readOnly && (
                        <p className="text-xs text-red-500 mt-1">Price must be &gt; 0</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        value={variant.compareAtPrice || ''}
                        onChange={(e) => updateVariant(idx, { compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="0.00"
                        disabled={readOnly}
                        className="w-24 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={variant.inventory || ''}
                        onChange={(e) => updateVariant(idx, { inventory: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        disabled={readOnly}
                        className="w-20 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={variant.status}
                        onChange={(e) => updateVariant(idx, { status: e.target.value as any })}
                        disabled={readOnly}
                        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => copyVariant(idx)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Copy variant"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove variant"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !readOnly && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">No variants yet. Click "Add Variant" or "Generate Variants" to get started.</p>
          </div>
        )
      )}
    </div>
  );
}