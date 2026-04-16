// app/components/ProperClothProductCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Shield, Ruler, Package, Heart, Eye } from 'lucide-react';

interface ProperClothProduct {
  id: string | number;
  name: string;
  brand: string;
  slug: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  originalPrice: number;
  discountPrice: number;
  imageUrl: string;
  fabricType?: string; // e.g., "Egyptian Cotton", "Linen"
  thickness?: 'Lightweight' | 'Midweight' | 'Heavyweight';
  isBestSeller?: boolean;
  isLimitedEdition?: boolean;
  sizesAvailable?: string[];
}

interface ProperClothProductCardProps {
  product: ProperClothProduct;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
}

const ProperClothProductCard = ({ 
  product, 
  onAddToCart, 
  onAddToWishlist 
}: ProperClothProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discountPercentage = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
  const hasDiscount = product.discountPrice < product.originalPrice;

  // Helper to render stars (Proper Cloth uses clean, minimal stars)
  const renderStars = () => {
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < fullStars 
                ? 'text-amber-600 fill-amber-600' 
                : i === fullStars && hasHalfStar
                ? 'text-amber-600 fill-amber-600 opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1.5">({product.reviewCount})</span>
      </div>
    );
  };

  // Format currency (USD as Proper Cloth is US-based)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div 
      className="group relative bg-white border border-gray-200 hover:border-amber-300 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ===== IMAGE SECTION ===== */}
      <Link href={`/product/${product.slug}`} className="block relative">
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* Placeholder for actual image - you would replace with <Image> from your data */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            [Product Image]
          </div>
          
          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.isBestSeller && (
              <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-semibold tracking-wide uppercase">
                Best Seller
              </span>
            )}
            {product.isLimitedEdition && (
              <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-semibold tracking-wide uppercase">
                Limited Edition
              </span>
            )}
          </div>

          {/* Hover Overlay with Quick Actions */}
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center gap-3 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button 
              onClick={() => onAddToCart?.(product.id.toString())}
              className="px-5 py-2 bg-white text-gray-900 text-sm font-medium tracking-wide hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-md"
            >
              Quick Add
            </button>
            <button 
              onClick={() => onQuickView?.(product.id.toString())}
              className="p-2 bg-white text-gray-900 hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-md"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* ===== PRODUCT INFO SECTION ===== */}
      <div className="p-4 space-y-2">
        {/* Brand & Wishlist Icon */}
        <div className="flex justify-between items-start">
          <Link href={`/brand/${product.brand.toLowerCase()}`}>
            <span className="text-xs text-gray-500 uppercase tracking-wide hover:text-amber-600 transition-colors">
              {product.brand}
            </span>
          </Link>
          <button 
            onClick={() => {
              setIsWishlisted(!isWishlisted);
              onAddToWishlist?.(product.id.toString());
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>

        {/* Product Name */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-800 text-base leading-tight hover:text-amber-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Fabric/Thickness Detail (Proper Cloth signature detail) */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          {product.fabricType && (
            <div className="flex items-center gap-1">
              <span className="capitalize">{product.fabricType}</span>
            </div>
          )}
          {product.thickness && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>{product.thickness}</span>
            </div>
          )}
        </div>

        {/* Ratings & Sold Count */}
        <div className="flex items-center justify-between pt-1">
          {renderStars()}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="w-3 h-3" />
            <span>{product.soldCount.toLocaleString()} sold</span>
          </div>
        </div>

        {/* Size Selector (Quick size pills) */}
        {product.sizesAvailable && product.sizesAvailable.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            <Ruler className="w-3 h-3 text-gray-400" />
            <div className="flex gap-1">
              {product.sizesAvailable.slice(0, 4).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-[10px] px-1.5 py-0.5 border ${
                    selectedSize === size 
                      ? 'border-amber-600 bg-amber-50 text-amber-700' 
                      : 'border-gray-300 text-gray-600 hover:border-amber-400'
                  } transition-colors`}
                >
                  {size}
                </button>
              ))}
              {product.sizesAvailable.length > 4 && (
                <span className="text-[10px] text-gray-400">+{product.sizesAvailable.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-xl font-semibold text-gray-900">
            {formatPrice(product.discountPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5">
                Save {discountPercentage}%
              </span>
            </>
          )}
        </div>

        {/* Premium Detail: "Made to Order" or similar trust text (Proper Cloth style) */}
        <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Made to Order</span>
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>Free Returns</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProperClothProductCard;