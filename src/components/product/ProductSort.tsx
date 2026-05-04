'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface ProductSortProps {
  onSortChange: (sortBy: string) => void;
  currentSort?: string;
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'popularity', label: 'Most Popular' },
];

export function ProductSort({ onSortChange, currentSort = 'newest' }: ProductSortProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = sortOptions.find(opt => opt.value === currentSort) || sortOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-amber-400 transition-colors"
      >
        <ArrowUpDown size={16} className="text-gray-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Sort: {selectedOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors ${
                  currentSort === option.value
                    ? 'text-amber-600 font-medium bg-amber-50 dark:bg-gray-700'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}