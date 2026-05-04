'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Star, Truck, ShieldCheck, RotateCcw, Heart, ShoppingBag, Zap, ChevronRight, Check, Minus, Plus } from 'lucide-react';
import { OrderFormModal } from './OrderFormModal';

interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
  discountPrice?: number;
  originalPrice?: number;
  images?: string[];
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  emiAvailable?: boolean;
  stock: number;
  description?: string;
  features?: string[];
}

interface ProductDrawerProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDrawer({ product, isOpen, onClose }: ProductDrawerProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!product) return null;
  
  const discountPercentage = product.discountPrice && product.originalPrice
    ? Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100)
    : 0;
  
  const currentPrice = product.discountPrice || product.price;
  const originalPrice = product.originalPrice || product.price;
  
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
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
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Quick View</h2>
              <p className="text-xs text-gray-500">{product.brand}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 p-6">
          {/* Left - Image Gallery */}
          <div className="lg:w-1/2">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 group">
              <Image
                src={product.images?.[selectedImage] || product.imageUrl || '/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  -{discountPercentage}%
                </div>
              )}
              
              {/* Wishlist Button */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Heart
                  size={18}
                  className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}
                />
              </button>
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    onMouseEnter={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-amber-500 shadow-lg'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Right - Product Details */}
          <div className="lg:w-1/2 space-y-6">
            {/* Brand & Rating */}
            <div>
              <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full mb-3">
                {product.brand}
              </div>
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
                      className={i < (product.rating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.reviewCount || 0} reviews
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ★ {product.soldCount || 0}+ sold
                </span>
              </div>
            </div>
            
            {/* Price */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ৳{currentPrice.toLocaleString()}
                </span>
                {discountPercentage > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ৳{originalPrice.toLocaleString()}
                    </span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-sm font-semibold">
                      Save ৳{(originalPrice - currentPrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              
              {/* EMI Info */}
              {product.emiAvailable && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  EMI starting from ৳{Math.ceil(currentPrice / 6)}/month
                </p>
              )}
            </div>
            
            {/* Key Features */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Truck size={20} className="mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Free Shipping</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <ShieldCheck size={20} className="mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-gray-600 dark:text-gray-400">1 Year Warranty</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <RotateCcw size={20} className="mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-gray-600 dark:text-gray-400">7 Days Return</p>
              </div>
            </div>
            
            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    In Stock • {product.stock} units available
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
                  onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowOrderForm(true)}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Buy Now
              </button>
              
              <button className="px-6 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl font-semibold hover:border-amber-500 hover:text-amber-600 transition-all flex items-center gap-2">
                <Heart size={18} />
                Wishlist
              </button>
            </div>
            
            {/* Description */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Product Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>
            
            {/* Features List */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
          image: product.images?.[0] || product.imageUrl,
        }}
      />
    </>
  );
}