'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, Package, Heart, Eye, TrendingUp, 
  AlertCircle, CheckCircle, ShoppingBag, Zap 
} from 'lucide-react';
import { IProduct } from '@/types/product';
import { ProductVariant } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductDrawer } from '@/hooks/useProductDrawer';

interface ProductCardProps {
  product: IProduct;
  priority?: boolean;
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { openDrawer } = useProductDrawer();
  
  const isWishlisted = isInWishlist(product._id);
  
  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const variantWithDiscount = product.variants.find(
        v => v.compareAtPrice && v.compareAtPrice > v.price
      );
      if (variantWithDiscount?.compareAtPrice) {
        return Math.round(
          ((variantWithDiscount.compareAtPrice - variantWithDiscount.price) / 
          variantWithDiscount.compareAtPrice) * 100
        );
      }
    }
    return 0;
  }, [product.variants]);
  
  const hasDiscount = discountPercentage > 0;
  
  // Get price information
  const { currentPrice, originalPrice } = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const comparePrices = product.variants
        .filter(v => v.compareAtPrice)
        .map(v => v.compareAtPrice || v.price);
      
      return {
        currentPrice: Math.min(...prices),
        originalPrice: comparePrices.length > 0 ? Math.min(...comparePrices) : Math.min(...prices)
      };
    }
    return {
      currentPrice: product.price,
      originalPrice: product.price
    };
  }, [product.variants, product.price]);
  
  // Check stock status
  const stockStatus = useMemo(() => {
    const isInStock = product.isAvailable && product.totalInventory > 0;
    const isLowStock = product.totalInventory > 0 && product.totalInventory <= 5;
    
    return {
      isInStock,
      isLowStock,
      text: !isInStock ? 'Out of Stock' : isLowStock ? `Only ${product.totalInventory} left` : 'In Stock',
      color: !isInStock ? 'text-red-600 bg-red-50' : isLowStock ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50',
      icon: !isInStock || isLowStock ? AlertCircle : CheckCircle
    };
  }, [product.isAvailable, product.totalInventory]);
  
  // Get product image
  const productImage = useMemo(() => {
    if (imageError) return null;
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.thumbnail) return product.thumbnail;
    return null;
  }, [product.images, product.thumbnail, imageError]);
  
  // Get default variant - FIXED: handle isDefault as optional boolean
  const defaultVariant = useMemo((): ProductVariant | undefined => {
    if (!product.variants || product.variants.length === 0) return undefined;
    // Check for isDefault === true (not just truthy)
    const defaultVar = product.variants.find(v => v.isDefault === true);
    return defaultVar || product.variants[0];
  }, [product.variants]);
  
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
      // Pass the variant if it exists, otherwise undefined
      await addToCart(product, defaultVariant, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
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
          {hasDiscount && discountPercentage > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full w-12 h-12 flex flex-col items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{discountPercentage}%</span>
                <span className="text-white text-[8px] -mt-0.5">OFF</span>
              </div>
            </div>
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
          <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent transform transition-all duration-300 z-10 ${
            isHovered && stockStatus.isInStock ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
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
                onClick={handleWishlist}
                className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-200 shadow-lg"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
              </button>
              <button
                onClick={handleQuickView}
                className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-200 shadow-lg"
                aria-label="Quick view"
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <Link 
            href={`/products/${product.slug}`} 
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-70 transition-opacity"
          >
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium hover:text-amber-600 transition-colors">
              {product.brand?.name || 'Unknown Brand'}
            </span>
          </Link>
          {product.soldCount !== undefined && product.soldCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp size={12} className="text-green-500" />
              <span>{product.soldCount.toLocaleString()} sold</span>
            </div>
          )}
        </div>

        <Link 
          href={`/products/${product.slug}`} 
          onClick={(e) => e.stopPropagation()}
          className="block group/title"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight line-clamp-2 group-hover/title:text-amber-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Stock Status */}
        {stockStatus.isInStock && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${stockStatus.color}`}>
            <StockIcon size={10} className={stockStatus.color.split(' ')[0]} />
            <span className={`text-[10px] font-medium ${stockStatus.color.split(' ')[0]}`}>
              {stockStatus.text}
            </span>
          </div>
        )}

        {/* Price Display */}
        <div className="flex items-baseline gap-2 pt-1 flex-wrap">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(currentPrice)}
          </span>
          
          {product.variants && product.variants.length > 1 && (
            <span className="text-xs text-gray-500">
              - {formatPrice(Math.max(...product.variants.map(v => v.price)))}
            </span>
          )}
          
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        
        {/* Variants count indicator */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Zap size={10} className="text-amber-500" />
            <span>{product.variants.length} variants available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;