// components/ProductCard.tsx - Fixed stock detection
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package, Heart, Eye, TrendingUp,
  AlertCircle, CheckCircle, ShoppingBag, Zap
} from 'lucide-react';
import { IProduct, IProductVariant } from '@/types/product';
import { useCartContext } from '@/app/context/CartContext';
import { useWishlistContext } from '@/app/context/WishlistContext';
import { useProductDrawer } from '@/hooks/useProductDrawer';

interface ProductCardProps {
  product: IProduct;
  priority?: boolean;
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { addToCart } = useCartContext();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const { openDrawer } = useProductDrawer();

  const isWishlisted = isInWishlist(product._id);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get default variant
  const defaultVariant = useMemo((): IProductVariant | undefined => {
    if (!product.variants?.length) return undefined;
    return product.variants.find(v => v.isDefault === true) || product.variants[0];
  }, [product.variants]);

  // Calculate available stock - FIXED: Check multiple sources
  const availableStock = useMemo(() => {
    // Priority 1: Check inventorySummary
    if (product.inventorySummary?.available !== undefined && product.inventorySummary.available > 0) {
      return product.inventorySummary.available;
    }
    
    // Priority 2: Check variants
    if (product.variants && product.variants.length > 0) {
      const totalStock = product.variants.reduce((sum, variant) => sum + (variant.inventory || 0), 0);
      if (totalStock > 0) return totalStock;
    }
    
    // Priority 3: Check totalInventory field
    if (product.totalInventory && product.totalInventory > 0) {
      return product.totalInventory;
    }
    
    // Default: no stock
    return 0;
  }, [product.inventorySummary, product.variants, product.totalInventory]);

  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (defaultVariant?.compareAtPrice && defaultVariant.compareAtPrice > defaultVariant.price) {
      return Math.round(((defaultVariant.compareAtPrice - defaultVariant.price) / defaultVariant.compareAtPrice) * 100);
    }
    return 0;
  }, [defaultVariant]);

  const hasDiscount = discountPercentage > 0;

  // Get price information
  const { currentPrice, originalPrice } = useMemo(() => {
    if (defaultVariant) {
      return {
        currentPrice: defaultVariant.price,
        originalPrice: defaultVariant.compareAtPrice || defaultVariant.price,
      };
    }
    return {
      currentPrice: product.lowestPrice || 0,
      originalPrice: product.lowestPrice || 0,
    };
  }, [defaultVariant, product.lowestPrice]);

  // Check stock status - FIXED: Better logic
  const stockStatus = useMemo(() => {
    // A product is in stock if:
    // 1. Status is 'active' (or 'published' depending on your enum)
    // 2. Available stock > 0
    // 3. Not deleted
    
    const isActive = product.status === 'active';
    const hasStock = availableStock > 0;
    const isNotDeleted = !product.deletedAt;
    
    const isInStock = isActive && hasStock && isNotDeleted;
    const isLowStock = isInStock && availableStock <= (product.inventorySummary?.lowStockThreshold || 5);

    // Debug logging - remove in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`Product ${product.name}:`, {
        status: product.status,
        availableStock,
        isInStock,
        inventorySummary: product.inventorySummary,
        variantsCount: product.variants?.length
      });
    }

    return {
      isInStock,
      isLowStock,
      text: !isInStock ? 'Out of Stock' : isLowStock ? `Only ${availableStock} left` : 'In Stock',
      color: !isInStock ? 'text-red-600 bg-red-50' : isLowStock ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50',
      icon: !isInStock || isLowStock ? AlertCircle : CheckCircle
    };
  }, [product.status, availableStock, product.deletedAt, product.inventorySummary]);

  // Get product image
  const productImage = useMemo(() => {
    if (imageError) return null;
    if (product.thumbnail) return product.thumbnail;
    if (product.imageGroups && product.imageGroups.length > 0) {
      const firstGroup = product.imageGroups[0];
      if (firstGroup.images && firstGroup.images.length > 0) {
        return firstGroup.images[0].url;
      }
    }
    return null;
  }, [product.thumbnail, product.imageGroups, imageError]);

  // Get brand name
  const brandName = useMemo(() => {
    if (typeof product.brandId === 'object' && product.brandId !== null) {
      return (product.brandId as any).name || 'Unknown Brand';
    }
    return 'Unknown Brand';
  }, [product.brandId]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    openDrawer(product);
  }, [product, openDrawer]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stockStatus.isInStock) return;

    setIsAddingToCart(true);
    try {
      await addToCart(product, defaultVariant, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, defaultVariant, addToCart, stockStatus.isInStock]);

  const handleBuyNow = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stockStatus.isInStock) return;

    setIsBuyingNow(true);
    try {
      await addToCart(product, defaultVariant, 1);
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Error buying now:', error);
    } finally {
      setIsBuyingNow(false);
    }
  }, [product, defaultVariant, addToCart, stockStatus.isInStock]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  }, [isWishlisted, product, removeFromWishlist, addToWishlist]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openDrawer(product);
  }, [product, openDrawer]);

  const StockIcon = stockStatus.icon;
  const variantCount = product.variants?.length || 0;

  return (
    <div
      className="group relative bg-white dark:bg-gray-900 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="relative aspect-square">
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <Package className="w-12 h-12 opacity-30" />
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg">
              -{discountPercentage}%
            </div>
          )}

          {/* Wishlist Button */}
          {mounted && (
            <button
              onClick={handleWishlist}
              className="absolute top-3 left-3 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 shadow-lg"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
            </button>
          )}

          {/* Out of Stock Overlay */}
          {!stockStatus.isInStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <span className="px-4 py-2 bg-white/95 text-gray-800 font-semibold rounded-full text-sm shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent transform transition-all duration-300 z-10 ${isHovered && stockStatus.isInStock ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}>
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !stockStatus.isInStock}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm disabled:cursor-not-allowed"
              >
                {isAddingToCart ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isBuyingNow || !stockStatus.isInStock}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm disabled:cursor-not-allowed"
              >
                {isBuyingNow ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={16} />
                    Buy Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Brand Row */}
        <div className="flex justify-between items-center">
          <Link
            href={`/products/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-70 transition-opacity"
          >
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium hover:text-amber-600 transition-colors">
              {brandName}
            </span>
          </Link>

          <button
            onClick={handleQuickView}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            aria-label="Quick view"
          >
            <Eye className="w-4 h-4 text-gray-500 hover:text-amber-600 transition-colors" />
          </button>
        </div>

        {/* Rating */}
        {product.ratingAverage > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(product.ratingAverage) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.ratingCount})</span>
          </div>
        )}

        {/* Product Name */}
        <Link
          href={`/products/${product.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="block group/title"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight line-clamp-2 group-hover/title:text-amber-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Stock Status Badge */}
        {stockStatus.isInStock && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${stockStatus.color}`}>
            <StockIcon size={10} className={stockStatus.color.split(' ')[0]} />
            <span className={`text-[10px] font-medium ${stockStatus.color.split(' ')[0]}`}>
              {stockStatus.text}
            </span>
          </div>
        )}

        {/* Price Display */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(currentPrice)}
          </span>

          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Price Range */}
        {variantCount > 1 && product.highestPrice && product.highestPrice > product.lowestPrice && (
          <div className="text-xs text-gray-500">
            Price range: {formatPrice(product.lowestPrice)} - {formatPrice(product.highestPrice)}
          </div>
        )}

        {/* Variants Count */}
        {variantCount > 1 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Zap size={10} className="text-amber-500" />
            <span>{variantCount} variants available</span>
          </div>
        )}

        {/* Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.badges.slice(0, 2).map((badge, index) => (
              <span
                key={badge.id || index}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                {badge.label}
              </span>
            ))}
            {product.badges.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600">
                +{product.badges.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;