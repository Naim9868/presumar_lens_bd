// app/categories/CategoriesClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowRight, Camera, Smartphone, Film, Package, Sparkles, 
  Grid3X3, Layers, ChevronRight, Search, X,
  Home, ChevronLeft
} from "lucide-react";
import { Category } from "@/types/category";

interface CategoriesClientProps {
  initialCategories: Category[];
}

const CategoriesClient = ({ initialCategories }: CategoriesClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'parent' | 'sub'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all categories (including subcategories) as a flat list
  const getAllCategories = (categories: Category[]): Category[] => {
    const allCategories: Category[] = [];
    
    const flattenCategories = (cats: Category[]) => {
      cats.forEach(cat => {
        allCategories.push(cat);
        if (cat.children && cat.children.length > 0) {
          flattenCategories(cat.children);
        }
      });
    };
    
    flattenCategories(categories);
    return allCategories;
  };

  // Filter categories based on type and search
  const getFilteredCategories = () => {
    const allCategories = getAllCategories(initialCategories);
    let filtered = allCategories;
    
    // Apply type filter
    switch (filterType) {
      case 'parent':
        filtered = initialCategories;
        break;
      case 'sub':
        filtered = allCategories.filter(cat => cat.parentId !== null);
        break;
      default:
        filtered = allCategories;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  // Icon mapping based on category name
  const getCategoryIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Macro Lens': <Camera className="w-6 h-6" />,
      'Extreme Macro': <Camera className="w-5 h-5" />,
      'Telephoto Lens': <Camera className="w-6 h-6" />,
      'Ultra Wide Angle': <Camera className="w-6 h-6" />,
      'Wide Angle': <Camera className="w-6 h-6" />,
      'Lenses': <Camera className="w-6 h-6" />,
      'Lens': <Camera className="w-6 h-6" />,
      'Smartphone': <Smartphone className="w-6 h-6" />,
      'Gimbals': <Film className="w-6 h-6" />,
      'Gimbal': <Film className="w-6 h-6" />,
      'Tripods': <Package className="w-6 h-6" />,
      'Tripod': <Package className="w-6 h-6" />,
      'Creator Gear': <Sparkles className="w-6 h-6" />,
    };
    
    // Find matching icon
    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key) || key.includes(name)) {
        return icon;
      }
    }
    return <Camera className="w-6 h-6" />;
  };

  // Get parent category name for subcategories
  const getParentName = (category: Category): string | null => {
    if (!category.parentId) return null;
    
    const findParent = (cats: Category[]): string | null => {
      for (const cat of cats) {
        if (cat._id === category.parentId) return cat.name;
        if (cat.children) {
          const found = findParent(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findParent(initialCategories);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedCategory(null);
  };

  // Render a single category card
  const renderCategoryCard = (category: Category, index: number) => {
    const isSubcategory = category.parentId !== null;
    const parentName = getParentName(category);
    
    return (
      <Link
        key={category._id}
        href={`/categories/${category.slug}`}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 block"
      >
        {/* Background Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#191970]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Subcategory Badge - Top Left */}
        {isSubcategory && (
          <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" />
            Subcategory
          </div>
        )}
        
        {/* Parent Category Indicator - Top Right */}
        {parentName && (
          <div className="absolute top-3 right-3 z-10 bg-[#191970]/80 backdrop-blur-sm text-white text-[9px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <ChevronRight className="w-2.5 h-2.5" />
            {parentName.length > 15 ? parentName.substring(0, 12) + '...' : parentName}
          </div>
        )}
        
        {/* Image Container */}
        <div className="relative pt-8 px-6 pb-3">
          <div className="relative w-32 h-32 mx-auto mb-4">
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 128px, 128px"
                className="object-contain transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
                {getCategoryIcon(category.name)}
              </div>
            )}
            
            {/* Floating Arrow Badge */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100 shadow-lg">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Category Name */}
          <h3 className="text-center text-gray-900 dark:text-white font-bold text-lg mb-2 group-hover:text-[#191970] dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            {category.name}
          </h3>
          
          {/* Description */}
          {category.description && (
            <p className="text-center text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2 px-2">
              {category.description.substring(0, 80)}...
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-500 pb-4">
            {category.children && category.children.length > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {category.children.length} Subcategories
              </span>
            )}
          </div>
        </div>
        
        {/* Bottom Border Animation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#191970] to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </Link>
    );
  };

  if (!initialCategories || initialCategories.length === 0) {
    return (
      <div className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-16 min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Categories Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Categories will appear here once added.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 text-amber-600 hover:text-amber-700 font-semibold"
            >
              <ArrowRight className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-16 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-amber-600 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-medium">All Categories</span>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Browse Collection
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            All Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover our complete range of mobile photography gear, from professional lenses to creator essentials
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Filter and View Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-full p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  filterType === 'all'
                    ? 'bg-[#191970] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setFilterType('parent')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  filterType === 'parent'
                    ? 'bg-[#191970] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                Main Categories
              </button>
              <button
                onClick={() => setFilterType('sub')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  filterType === 'sub'
                    ? 'bg-[#191970] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                Subcategories
              </button>
            </div>
            
            {/* Clear Filters Button */}
            {(searchQuery || filterType !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-full p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-[#191970] text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-full transition-all duration-300 ${
                viewMode === 'compact'
                  ? 'bg-[#191970] text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 mt-4 text-amber-600 hover:text-amber-700 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredCategories.map((category, index) => renderCategoryCard(category, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesClient;