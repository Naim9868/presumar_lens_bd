// app/components/category/CategoryClient.tsx
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, Camera, Smartphone, Film, Package, Sparkles, 
  Grid3X3, Layers, ChevronRight, FolderTree 
} from "lucide-react";

// Define proper types
interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  children?: Category[];
  productCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface CategoryClientProps {
  initialCategories: Category[];
}

const CategoryClient = ({ initialCategories }: CategoryClientProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'parent' | 'sub'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Get all categories (including subcategories) as a flat list
  const getAllCategories = useMemo(() => {
    const flattenCategories = (categories: Category[]): Category[] => {
      const all: Category[] = [];
      categories.forEach(cat => {
        all.push(cat);
        if (cat.children && cat.children.length > 0) {
          all.push(...flattenCategories(cat.children));
        }
      });
      return all;
    };
    return flattenCategories(initialCategories);
  }, [initialCategories]);

  // Filter categories based on type
  const filteredCategories = useMemo(() => {
    switch (filterType) {
      case 'parent':
        return initialCategories; // Only parent categories
      case 'sub':
        return getAllCategories.filter(cat => cat.parentId !== null); // Only subcategories
      default:
        return getAllCategories; // All categories
    }
  }, [filterType, initialCategories, getAllCategories]);

  // Icon mapping based on category name
  const getCategoryIcon = (name: string): React.ReactNode => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('macro') || lowerName.includes('telephoto') || lowerName.includes('wide') || lowerName.includes('lens')) {
      return <Camera className="w-6 h-6" />;
    }
    if (lowerName.includes('smartphone') || lowerName.includes('phone')) {
      return <Smartphone className="w-6 h-6" />;
    }
    if (lowerName.includes('gimbal')) {
      return <Film className="w-6 h-6" />;
    }
    if (lowerName.includes('tripod')) {
      return <Package className="w-6 h-6" />;
    }
    if (lowerName.includes('creator') || lowerName.includes('gear')) {
      return <Sparkles className="w-6 h-6" />;
    }
    return <Camera className="w-6 h-6" />;
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

  // Get product count display
  const getProductCountDisplay = (category: Category): string => {
    if (category.productCount && category.productCount > 0) {
      return `${category.productCount} ${category.productCount === 1 ? 'Product' : 'Products'}`;
    }
    return '';
  };

  // Get subcategory count display
  const getSubcategoryCountDisplay = (category: Category): string => {
    if (category.children && category.children.length > 0) {
      return `${category.children.length} ${category.children.length === 1 ? 'Subcategory' : 'Subcategories'}`;
    }
    return '';
  };

  if (!initialCategories || initialCategories.length === 0) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm">
            <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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

  if (filteredCategories.length === 0) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Categories Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try changing the filter or check back later.
            </p>
            <button
              onClick={() => setFilterType('all')}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              View All Categories
            </button>
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
                aria-label="Grid view"
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
                aria-label="Compact view"
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
          {filteredCategories.map((category) => {
            const isSubcategory = category.parentId !== null;
            const parentName = getParentName(category);
            const productCountText = getProductCountDisplay(category);
            const subcategoryCountText = getSubcategoryCountDisplay(category);
            const hasStats = productCountText || subcategoryCountText;
            const isHovered = hoveredId === category._id;
            
            return (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 block"
                onMouseEnter={() => setHoveredId(category._id)}
                onMouseLeave={() => setHoveredId(null)}
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
                    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}>
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
                      {category.description.length > 80 
                        ? `${category.description.substring(0, 80)}...` 
                        : category.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  {hasStats && (
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-500 pb-4">
                      {subcategoryCountText && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {subcategoryCountText}
                        </span>
                      )}
                      {productCountText && (
                        <span>{productCountText}</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Bottom Border Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#191970] to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            );
          })}
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