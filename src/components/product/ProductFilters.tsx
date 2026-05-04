'use client';

import { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { FilterOptions } from '@/types';

interface ProductFiltersProps {
  brands: Array<{ _id: string; name: string; slug: string }>;
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  onClose?: () => void;
  isMobile?: boolean;
}

export function ProductFilters({ brands, onFilterChange, initialFilters, onClose, isMobile = false }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [expandedSections, setExpandedSections] = useState<string[]>(['price', 'brands']);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters?.brands || []);
  const [priceRange, setPriceRange] = useState({ min: initialFilters?.minPrice || 0, max: initialFilters?.maxPrice || 100000 });
  const [inStockOnly, setInStockOnly] = useState(initialFilters?.inStock || false);
  const [selectedRating, setSelectedRating] = useState(initialFilters?.rating || 0);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId) ? prev.filter(b => b !== brandId) : [...prev, brandId]
    );
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    setPriceRange(prev => ({ ...prev, [type]: value }));
  };

  const applyFilters = () => {
    onFilterChange({
      minPrice: priceRange.min > 0 ? priceRange.min : undefined,
      maxPrice: priceRange.max < 100000 ? priceRange.max : undefined,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      inStock: inStockOnly || undefined,
      rating: selectedRating > 0 ? selectedRating : undefined,
    });
    if (isMobile && onClose) onClose();
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 100000 });
    setInStockOnly(false);
    setSelectedRating(0);
    onFilterChange({});
    if (isMobile && onClose) onClose();
  };

  const hasActiveFilters = selectedBrands.length > 0 || priceRange.min > 0 || priceRange.max < 100000 || inStockOnly || selectedRating > 0;

  const FilterSection = ({ title, section, children }: { title: string; section: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-200 dark:border-gray-800 py-4">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        {expandedSections.includes(section) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expandedSections.includes(section) && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );

  const filterContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Filter size={18} />
          Filters
        </h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-amber-600 hover:text-amber-700">
            Clear all
          </button>
        )}
      </div>

      {/* Price Range */}
      <FilterSection title="Price Range" section="price">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Min (৳)</label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-800"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Max (৳)</label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-800"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            value={priceRange.max}
            onChange={(e) => handlePriceChange('max', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Brands" section="brands">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map(brand => (
            <label key={brand._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand._id)}
                onChange={() => handleBrandToggle(brand._id)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{brand.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" section="availability">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
        </label>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer Rating" section="rating">
        <div className="space-y-2">
          {[4, 3, 2, 1].map(rating => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={selectedRating === rating}
                onChange={() => setSelectedRating(rating)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">& Up</span>
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Apply Button for Mobile */}
      {isMobile && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={applyFilters}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
        </button>

        {/* Mobile Filter Drawer */}
        {isOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-xl overflow-y-auto animate-in slide-in-from-right">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                {filterContent}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sticky top-24">{filterContent}</div>;
}

// Import Star for rating display
import { Star } from 'lucide-react';