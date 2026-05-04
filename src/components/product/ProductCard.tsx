'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Heart, Eye, TrendingUp, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import { ProductDrawer } from './ProductDrawer';
import { TransformedProduct } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductDrawer } from '@/hooks/useProductDrawer';

interface ProductCardProps {
  product: TransformedProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { openDrawer } = useProductDrawer();
  
  const isWishlisted = isInWishlist(product._id);
  const discountPercentage = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
  const hasDiscount = product.discountPrice < product.originalPrice;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isInStock = product.isAvailable && product.stock > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStockStatus = () => {
    if (!isInStock) {
      return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
    }
    if (isLowStock) {
      return { text: `Only ${product.stock} left`, color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
    }
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    openDrawer(product as any);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addToCart(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDrawer(product as any);
  };

  return (
    <>
      <div 
        className="group relative bg-white dark:bg-gray-900 rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="relative aspect-square">
            {product.imageUrl && !imageError ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Package className="w-12 h-12 opacity-30" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
              {product.badges.isBestSeller && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded shadow-sm">
                  BESTSELLER
                </span>
              )}
              {product.badges.isPremium && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded shadow-sm">
                  PREMIUM
                </span>
              )}
              {product.badges.isNewArrival && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded shadow-sm">
                  NEW
                </span>
              )}
            </div>
            
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
            {!isInStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                <span className="px-4 py-2 bg-white/95 text-gray-800 font-semibold rounded-full text-sm shadow-lg">
                  Out of Stock
                </span>
              </div>
            )}
            
            {/* Quick Action Buttons */}
            <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent transform transition-all duration-300 z-10 ${
              isHovered && isInStock ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm"
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlist}
                  className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-200 shadow-lg"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                </button>
                <button
                  onClick={handleQuickView}
                  className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-200 shadow-lg"
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
            <Link href={`/products/${product.slug}`} onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium hover:text-amber-600 transition-colors">
                {product.brand}
              </span>
            </Link>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp size={12} className="text-green-500" />
              <span>{product.soldCount.toLocaleString()} sold</span>
            </div>
          </div>

          <Link href={`/products/${product.slug}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight line-clamp-2 hover:text-amber-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.floor(product.rating) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'text-gray-300 dark:text-gray-600'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>

          {/* Stock Status */}
          {isInStock && (
            <div className={`inline-flex items-center gap-1 ${stockStatus.bg} px-2 py-0.5 rounded-full`}>
              <StockIcon size={10} className={stockStatus.color} />
              <span className={`text-[10px] font-medium ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(product.discountPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Drawer */}
      <ProductDrawer />
    </>
  );
};

export default ProductCard;