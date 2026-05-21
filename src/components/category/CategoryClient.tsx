// app/components/category/CategoryClient.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, Camera, Smartphone, Film, Package, Sparkles, 
  Grid3X3, Layers, ChevronRight 
} from "lucide-react";
import { Category } from "@/types/category";

interface CategoryClientProps {
  initialCategories: Category[];
}

const CategoryClient = ({ initialCategories }: CategoryClientProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'parent' | 'sub'>('all');

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

  // Filter categories based on type
  const getFilteredCategories = () => {
    const allCategories = getAllCategories(initialCategories);
    
    switch (filterType) {
      case 'parent':
        return initialCategories; // Only parent categories
      case 'sub':
        return allCategories.filter(cat => cat.parentId !== null); // Only subcategories
      default:
        return allCategories; // All categories
    }
  };

  const filteredCategories = getFilteredCategories();

  // Icon mapping based on category name
  const getCategoryIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Macro Lens': <Camera className="w-6 h-6" />,
      'Extreme Macro': <Camera className="w-5 h-5" />,
      'Telephoto Lens': <Camera className="w-6 h-6" />,
      'Ultra Wide Angle': <Camera className="w-6 h-6" />,
      'Lenses': <Camera className="w-6 h-6" />,
      'Smartphone': <Smartphone className="w-6 h-6" />,
      'Gimbals': <Film className="w-6 h-6" />,
      'Tripods': <Package className="w-6 h-6" />,
      'Creator Gear': <Sparkles className="w-6 h-6" />,
    };
    return iconMap[name] || <Camera className="w-6 h-6" />;
  };

  // Get parent category name for subcategories
  const getParentName = (category: Category): string | null => {
    if (!category.parentId) return null;
    
    // Find parent from initialCategories
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
            {parentName}
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
          <h3 className="text-center text-gray-900 dark:text-white font-bold text-lg mb-2 group-hover:text-[#191970] dark:group-hover:text-amber-400 transition-colors">
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
            {category.productCount !== undefined && category.productCount > 0 && (
              <span>{category.productCount} Products</span>
            )}
          </div>
        </div>
        
        {/* Bottom Border Animation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#191970] to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </Link>
    );
  };

  if (!filteredCategories || filteredCategories.length === 0) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Categories Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Categories will appear here once added.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        {/* Section Header with Filters */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Shop by Category
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Our Collections
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover premium mobile photography gear curated for creators who demand excellence
          </p>
          
          {/* Filter and View Mode Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
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
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
          </div>
        </div>

        {/* Categories Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredCategories.map((category, index) => renderCategoryCard(category, index))}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-12">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#191970] to-[#2563EB] text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <span>Browse All Collections</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryClient;