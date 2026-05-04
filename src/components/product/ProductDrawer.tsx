'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Star, Truck, ShieldCheck, RotateCcw, Heart, ShoppingBag, Zap, Check, Minus, Plus, Package } from 'lucide-react';
import { OrderFormModal } from '@/components/checkout/OrderFormModal';
import { ProductVariantSelector } from './ProductVariantSelector';
import { ProductImageGallery } from './ProductImageGallery';
import { useProductDrawer } from '@/hooks/useProductDrawer';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductVariant } from '@/types';
import toast from 'react-hot-toast';

export function ProductDrawer() {
  const { isOpen, product, closeDrawer } = useProductDrawer();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuantity(1);
      setSelectedVariant(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.discountPrice;
  const compareAtPrice = selectedVariant?.compareAtPrice || product.originalPrice;
  const discountPercentage = compareAtPrice > currentPrice 
    ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)
    : 0;
  const hasDiscount = discountPercentage > 0;
  const isInStock = selectedVariant 
    ? (selectedVariant.inventory - selectedVariant.reserved) > 0
    : product.stock > 0;
  const availableStock = selectedVariant 
    ? selectedVariant.inventory - selectedVariant.reserved
    : product.stock;
  const isWishlisted = isInWishlist(product._id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }

    setIsAddingToCart(true);
    const success = await addToCart(product, selectedVariant || undefined, quantity);
    setIsAddingToCart(false);
    
    if (success) {
      closeDrawer();
    }
  };

  const handleBuyNow = () => {
    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }
    setShowOrderForm(true);
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl z-50 transition-transform duration-500 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Package size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Quick View</h2>
              <p className="text-xs text-gray-500">{product.brand}</p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 p-6">
          {/* Left - Image Gallery */}
          <div className="lg:w-1/2">
            <ProductImageGallery images={product.images} productName={product.name} />
          </div>
          
          {/* Right - Product Details */}
          <div className="lg:w-1/2 space-y-6">
            {/* Brand & Rating */}
            <div>
              <Link href={`/brands/${product.brandId?.slug}`} className="inline-block">
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full mb-3 hover:bg-amber-200 transition-colors">
                  {product.brand}
                </span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.reviewCount} reviews
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ★ {product.soldCount}+ sold
                </span>
              </div>
            </div>
            
            {/* Price */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(currentPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(compareAtPrice)}
                    </span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-sm font-semibold">
                      Save {formatPrice(compareAtPrice - currentPrice)}
                    </span>
                  </>
                )}
              </div>
              
              {/* EMI Info */}
              {product.emiAvailable && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  EMI starting from {formatPrice(Math.ceil(currentPrice / 6))}/month
                </p>
              )}
            </div>
            
            {/* Key Features */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                {product.freeShipping ? <Truck size={20} className="mx-auto mb-1 text-amber-600" /> : <Package size={20} className="mx-auto mb-1 text-gray-400" />}
                <p className="text-xs text-gray-600 dark:text-gray-400">{product.freeShipping ? 'Free Shipping' : 'Shipping Fee Apply'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <ShieldCheck size={20} className="mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-gray-600 dark:text-gray-400">{product.warranty} Warranty</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <RotateCcw size={20} className="mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-gray-600 dark:text-gray-400">7 Days Return</p>
              </div>
            </div>
            
            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <ProductVariantSelector
                variants={product.variants}
                onVariantSelect={setSelectedVariant}
                selectedVariant={selectedVariant || undefined}
              />
            )}
            
            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isInStock ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    In Stock • {availableStock} units available
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-600">Out of Stock</span>
                </>
              )}
            </div>
            
            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  disabled={quantity >= availableStock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBuyNow}
                disabled={!isInStock}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Buy Now
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || isAddingToCart}
                className="flex-1 border-2 border-gray-300 dark:border-gray-700 hover:border-amber-500 hover:text-amber-600 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingToCart ? (
                  <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Add to Cart
                  </>
                )}
              </button>
              
              <button
                onClick={handleWishlist}
                className="px-6 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-rose-500 transition-all flex items-center justify-center"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
              </button>
            </div>
            
            {/* Short Description */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Product Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.shortDescription || product.description?.substring(0, 200)}...
              </p>
              <Link href={`/products/${product.slug}`} onClick={closeDrawer}>
                <span className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium">
                  View full details →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Form Modal */}
      <OrderFormModal
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        product={{
          id: product._id,
          name: product.name,
          price: currentPrice,
          quantity: quantity,
          image: product.thumbnail,
          sku: selectedVariant?.sku,
          variantId: selectedVariant?.sku,
        }}
      />
    </>
  );
}