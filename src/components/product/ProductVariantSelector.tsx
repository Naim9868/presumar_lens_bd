'use client';

import { useState, useEffect } from 'react';
import { ProductVariant, VariantAttribute } from '@/types';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant) => void;
  selectedVariant?: ProductVariant;
}

export function ProductVariantSelector({ variants, onVariantSelect, selectedVariant }: ProductVariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  
  // Extract unique attributes from variants
  const getUniqueAttributes = () => {
    const attributesMap = new Map<string, Set<string>>();
    
    variants.forEach(variant => {
      variant.attributes.forEach(attr => {
        if (!attributesMap.has(attr.key)) {
          attributesMap.set(attr.key, new Set());
        }
        attributesMap.get(attr.key)?.add(attr.value);
      });
    });
    
    return Array.from(attributesMap.entries()).map(([key, values]) => ({
      key,
      values: Array.from(values),
    }));
  };
  
  const uniqueAttributes = getUniqueAttributes();
  
  // Find variant by selected attributes
  const findVariantByAttributes = (attrs: Record<string, string>) => {
    return variants.find(variant =>
      variant.attributes.every(attr => attrs[attr.key] === attr.value)
    );
  };
  
  const isAttributeAvailable = (attrKey: string, attrValue: string) => {
    const testAttributes = { ...selectedAttributes, [attrKey]: attrValue };
    return variants.some(variant =>
      variant.attributes.every(attr => testAttributes[attr.key] === attr.value)
    );
  };
  
  const handleAttributeSelect = (key: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(newAttributes);
    
    const variant = findVariantByAttributes(newAttributes);
    if (variant) {
      onVariantSelect(variant);
    }
  };
  
  // Initialize with default variant
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const defaultVariant = variants.find(v => v.isDefault) || variants[0];
      const defaultAttributes: Record<string, string> = {};
      defaultVariant.attributes.forEach(attr => {
        defaultAttributes[attr.key] = attr.value;
      });
      setSelectedAttributes(defaultAttributes);
      onVariantSelect(defaultVariant);
    }
  }, [variants, selectedVariant, onVariantSelect]);
  
  if (uniqueAttributes.length === 0) return null;
  
  return (
    <div className="space-y-4">
      {uniqueAttributes.map(attr => (
        <div key={attr.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
            {attr.key}
          </label>
          <div className="flex flex-wrap gap-2">
            {attr.values.map(value => {
              const isSelected = selectedAttributes[attr.key] === value;
              const isAvailable = isAttributeAvailable(attr.key, value);
              
              return (
                <button
                  key={value}
                  onClick={() => isAvailable && handleAttributeSelect(attr.key, value)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : isAvailable
                      ? 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}