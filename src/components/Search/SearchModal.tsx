"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Search, Package, TrendingUp, Clock, Star } from "lucide-react";

interface Product {
    _id: string;
    name: string;
    slug: string;
    thumbnail: string;
    lowestPrice?: number;
}

interface Props {
    open: boolean;
    loading: boolean;
    products: Product[];
    onClose: () => void;
}

const SearchModal = ({
    open,
    loading,
    products,
    onClose,
}: Props) => {
    if (!open) return null;

    const formatPrice = (price?: number) => {
        if (!price) return "$0";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <>
            {/* Backdrop with blur and fade animation */}
            <div
                className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm top-[124px] md:top-[88px]"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-[999] overflow-y-auto top-[90px] md:top-[88px]">
                <div className="min-h-full flex items-start justify-center p-3 md:p-4">
                    <div className="w-full max-w-2xl mt-20 md:mt-20">
                        {/* Modal Content */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">

                            {/* Header - Fixed for mobile */}
                            <div className="relative bg-gradient-to-r from-[#191970] to-[#2563EB] px-4 md:px-6 py-4 md:py-5">
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="relative flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0 p-1.5 md:p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Search className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white text-base md:text-xl font-bold truncate">
                                                Search Results
                                            </h3>
                                            <p className="text-blue-100 text-[10px] md:text-xs mt-0.5 truncate">
                                                {!loading && products.length > 0
                                                    ? `Found ${products.length} product${products.length === 1 ? '' : 's'}`
                                                    : "Discover premium photography gear"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="flex-shrink-0 p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                                        aria-label="Close search"
                                    >
                                        <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Results Container */}
                            <div className="max-h-[60vh] md:max-h-[500px] overflow-y-auto custom-scrollbar">

                                {/* Loading State */}
                                {loading && (
                                    <div className="p-8 md:p-12 text-center">
                                        <div className="inline-flex flex-col items-center gap-3 md:gap-4">
                                            <div className="relative w-10 h-10 md:w-12 md:h-12">
                                                <div className="absolute inset-0 border-3 border-gray-200 dark:border-slate-700 rounded-full"></div>
                                                <div className="absolute inset-0 border-3 border-[#191970] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base">
                                                Searching for products...
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && products.length === 0 && (
                                    <div className="p-8 md:p-12 text-center">
                                        <div className="inline-flex flex-col items-center gap-3 md:gap-4">
                                            <div className="p-3 md:p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                                                <Package className="w-10 h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-gray-700 dark:text-gray-300 font-semibold text-base md:text-lg">
                                                    No products found
                                                </p>
                                                <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm mt-1">
                                                    Try searching with different keywords
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Products List */}
                                {!loading && products.length > 0 && (
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {products.map((product, index) => (
                                            <Link
                                                key={product._id}
                                                href={`/products/${product.slug}`}
                                                onClick={onClose}
                                                className="group block transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-slate-800/50"
                                                style={{
                                                    animationDelay: `${index * 50}ms`
                                                }}
                                            >
                                                <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 animate-in fade-in slide-in-from-left-4 duration-300">

                                                    {/* Product Image */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-[#191970]/10 to-transparent rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shadow-md group-hover:shadow-lg transition-all duration-300">
                                                            {product.thumbnail ? (
                                                                <Image
                                                                    src={product.thumbnail}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Hover Badge */}
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100">
                                                            <TrendingUp className="w-2 h-2 md:w-3 md:h-3 text-white" />
                                                        </div>
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-800 dark:text-white text-xs md:text-sm line-clamp-2 md:line-clamp-1 group-hover:text-[#191970] dark:group-hover:text-amber-400 transition-colors duration-200">
                                                            {product.name}
                                                        </h4>

                                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                                                            {/* Price */}
                                                            <p className="text-[#191970] dark:text-amber-400 font-bold text-sm md:text-base">
                                                                {formatPrice(product.lowestPrice)}
                                                            </p>

                                                            {/* Price Badge */}
                                                            {product.lowestPrice && product.lowestPrice > 100 && (
                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                                    <Star className="w-2 h-2 md:w-2.5 md:h-2.5 text-green-600 dark:text-green-400" />
                                                                    <span className="text-[8px] md:text-[10px] font-semibold text-green-600 dark:text-green-400">
                                                                        Premium
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* New Badge */}
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                                                <Clock className="w-2 h-2 md:w-2.5 md:h-2.5 text-amber-600 dark:text-amber-400" />
                                                                <span className="text-[8px] md:text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                                    Available
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Arrow Indicator - Hidden on mobile, visible on hover desktop */}
                                                    <div className="hidden md:block flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
                                                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-[#191970] transition-colors duration-300">
                                                            <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* Mobile chevron indicator */}
                                                    <div className="md:hidden flex-shrink-0 text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {!loading && products.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-slate-800 px-4 md:px-6 py-2 md:py-3 bg-gray-50 dark:bg-slate-900/50">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            Showing {products.length} results
                                        </span>
                                        <span className="hidden md:inline">Click any item to view details</span>
                                        <span className="md:hidden">Tap to view details</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-top-4 {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-left-4 {
          from {
            opacity: 0;
            transform: translateX(-1rem);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
        }
        
        .slide-in-from-top-4 {
          animation-name: slide-in-from-top-4;
        }
        
        .slide-in-from-left-4 {
          animation-name: slide-in-from-left-4;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }
        
        /* Mobile optimized scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
        }
      `}</style>
        </>
    );
};

export default SearchModal;