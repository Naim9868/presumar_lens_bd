// components/product/ProductDrawer.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, Star, Heart, ShoppingBag, Truck, Shield, RotateCcw,
  AlertCircle, CheckCircle, Minus, Plus, Share2, ExternalLink,
  ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { useProductDrawer } from '@/hooks/useProductDrawer';
import { useCheckout } from '@/hooks/useCheckout';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import type { IProduct, ProductSpec } from '@/types/product';
import toast from 'react-hot-toast';
import { ProductVariant } from '@/types';

interface ProductDrawerProps {
  onViewFullDetails?: () => void;
}

export function ProductDrawer({ onViewFullDetails }: ProductDrawerProps) {
  const router = useRouter();
  const { product, isOpen, closeDrawer } = useProductDrawer();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { openCheckout } = useCheckout();

  // State
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Extract unique attribute types from variants
  const attributeTypes = useMemo(() => {
    if (!product?.variants?.length) return [];

    const map = new Map<string, Set<string>>();

    product.variants.forEach(variant => {
      variant.attributes?.forEach(attr => {
        if (!map.has(attr.key)) map.set(attr.key, new Set());
        map.get(attr.key)!.add(attr.value);
      });
    });

    return Array.from(map.entries()).map(([key, values]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      values: Array.from(values),
    }));
  }, [product]);


  // Get current price from selected variant or product
  // const currentPrice = useMemo(() => {
  //   if (selectedVariant) {
  //     return selectedVariant.price;
  //   }
  //   return product?.price || 0;
  // }, [selectedVariant, product]);

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;

  // Get compare at price
  // const compareAtPrice = useMemo(() => {
  //   if (selectedVariant?.compareAtPrice) {
  //     return selectedVariant.compareAtPrice;
  //   }
  //   return null;
  // }, [selectedVariant]);
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;

  const hasDiscount = compareAtPrice !== null && compareAtPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((compareAtPrice! - currentPrice) / compareAtPrice!) * 100) : 0;

  // Get stock status from selected variant or product
  // const currentStock = useMemo(() => {
  //   if (selectedVariant) {
  //     return selectedVariant.inventory - (selectedVariant.reserved || 0);
  //   }
  //   return product?.totalInventory || 0;
  // }, [selectedVariant, product?.totalInventory]);

  // const isInStock = useMemo(() => {
  //   if (selectedVariant) {
  //     return selectedVariant.status === 'in_stock' && currentStock > 0;
  //   }
  //   return product?.isAvailable === true && currentStock > 0;
  // }, [selectedVariant, product?.isAvailable, currentStock]);
  const currentStock = selectedVariant
    ? selectedVariant.inventory - (selectedVariant.reserved || 0)
    : product?.totalInventory ?? 0;

  const isInStock = selectedVariant
    ? selectedVariant.status === 'in_stock' && currentStock > 0
    : product?.isAvailable && currentStock > 0;

  // Get current image
  const getCurrentImage = useCallback(() => {
    if (!product) return '/placeholder.jpg';

    if (selectedVariant?.images?.length) {
      return selectedVariant.images[selectedImage] || selectedVariant.images[0];
    }

    if (product.images?.length) {
      return product.images[selectedImage] || product.images[0];
    }

    return product.thumbnail || '/placeholder.jpg';
  }, [product, selectedVariant, selectedImage]);

  // Group specifications by group
  const groupedSpecs = useMemo(() => {
    if (!product?.specsFlat || product.specsFlat.length === 0) {
      return new Map<string, ProductSpec[]>();
    }

    const groups = new Map<string, ProductSpec[]>();
    product.specsFlat.forEach(spec => {
      const groupName = spec.group || 'General Specifications';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)?.push(spec);
    });

    return groups;
  }, [product]);

  // Find matching variant based on selected attributes
  useEffect(() => {
    if (!product?.variants?.length) return;

    if (Object.keys(selectedAttributes).length === 0) return;

    const matchingVariant = product.variants.find(variant =>
      variant.attributes.every(
        attr => selectedAttributes[attr.key] === attr.value
      )
    );

    if (matchingVariant) {
      setSelectedVariant(prev => {
        if (prev?.variantKey === matchingVariant.variantKey) {
          return prev; // prevent re-set → avoids loop
        }
        return matchingVariant;
      });

      setSelectedImage(0);
      setQuantity(1);
    }
  }, [product]);

  const resetDrawerState = useCallback(() => {
  setSelectedImage(0);
  setQuantity(1);
  setSelectedAttributes({});
  setActiveTab('details');
  setShowFullDescription(false);
  setShowAllReviews(false);
}, []);

  // Reset state when product changes
  useEffect(() => {
  if (!isOpen || !product) return;

  resetDrawerState();

  const defaultVariant =
    product.variants?.find(v => v.isDefault) || product.variants?.[0];

  if (defaultVariant) {
    const attrs: Record<string, string> = {};

    defaultVariant.attributes.forEach(attr => {
      attrs[attr.key] = attr.value;
    });

    setSelectedAttributes(attrs);
    setSelectedVariant(defaultVariant);
  }
}, [isOpen, product, resetDrawerState]);

  // Close on escape key
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeDrawer();
      setIsClosing(false);
    }, 200);
  };


  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isClosing]);

  // Prevent body scroll when drawer is open
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

  // Fetch reviews
  useEffect(() => {
    if (product?._id && isOpen) {
      fetchReviews();
    }
  }, [product?._id, isOpen]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews?productId=${product?._id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const isWishlisted = product ? isInWishlist(product._id) : false;

  const handleAttributeSelect = (key: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  
  const handleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${product?.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleViewFullDetails = () => {
    if (product?.slug) {
      handleClose();
      setTimeout(() => {
        router.push(`/products/${product.slug}`);
        onViewFullDetails?.();
      }, 200);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }

    addToCart(product, selectedVariant || undefined, quantity);
    toast.success('Added to cart');
  };

  // IMPORTANT: handleBuyNow must be defined before being used in JSX
  const handleBuyNow = useCallback(() => {
    if (!product) return;
    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }

    handleClose();
    setTimeout(() => {
      openCheckout({
        productId: product._id,
        name: product.name,
        price: currentPrice,
        quantity,
        image: getCurrentImage(),
        variantId: selectedVariant?.variantKey,
        sku: selectedVariant?.sku,
      });
    }, 200);
  }, [product, isInStock, currentPrice, quantity, getCurrentImage, selectedVariant, openCheckout]);

  const getAvailableValues = useCallback((attrKey: string) => {
    if (!product?.variants) return new Set<string>();

    const available = new Set<string>();
    product.variants.forEach(variant => {
      const attrValue = variant.attributes.find(a => a.key === attrKey)?.value;
      if (attrValue && variant.status === 'in_stock' && (variant.inventory - (variant.reserved ?? 0)) > 0) {
        available.add(attrValue);
      }
    });
    return available;
  }, [product]);

  if (!isOpen || !product) return null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const hasMoreReviews = reviews.length > 3;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
      />

      {/* Drawer */}
      <aside className={`
        fixed right-0 top-0 h-full w-full md:w-[950px] lg:w-[1100px] 
        bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col
        ${isClosing ? 'animate-slideOutRight' : 'animate-slideInLeft'}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {product.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Quick View
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              title="Share"
            >
              <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Rest of your JSX remains the same... */}
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6">

              {/* Left Column - Gallery */}
              <div className="lg:w-1/2">
                <div className="sticky top-6">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
                    <Image
                      src={getCurrentImage()}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />

                    <button
                      onClick={handleWishlist}
                      className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Heart
                        size={18}
                        className={isWishlisted
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-700 dark:text-gray-300'
                        }
                      />
                    </button>

                    {hasDiscount && (
                      <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                        -{discountPercent}%
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {(selectedVariant?.images?.length || product.images?.length) > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {(selectedVariant?.images?.length ? selectedVariant.images : product.images).map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                            ? 'border-amber-500 dark:border-amber-400 shadow-md'
                            : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} - ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:w-1/2 space-y-6">
                {/* Brand & Title */}
                <div>
                  {product.brand && (
                    <Link
                      href={`/brands/${product.brand.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-block mb-2"
                    >
                      {product.brand.name}
                    </Link>
                  )}
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ৳{currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        ৳{compareAtPrice?.toLocaleString()}
                      </span>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold px-2.5 py-1 rounded-full">
                        Save ৳{(compareAtPrice! - currentPrice).toLocaleString()}
                      </span>
                    </>
                  )}
                  {product.maxPrice > currentPrice && !selectedVariant && (
                    <span className="text-sm text-gray-500">
                      - ৳{product.maxPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  {isInStock ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        In Stock
                      </span>
                      {currentStock <= 10 && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                          Only {currentStock} left
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        Out of Stock
                      </span>
                    </>
                  )}
                </div>

                {/* Variant Attributes Selection */}
                {attributeTypes.map(attr => {
                  const availableValues = getAvailableValues(attr.key);

                  return (
                    <div key={attr.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select {attr.label}
                        </label>
                        {selectedAttributes[attr.key] && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Selected: {selectedAttributes[attr.key]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map(value => {
                          const isAvailable = availableValues.has(value);
                          const isSelected = selectedAttributes[attr.key] === value;

                          return (
                            <button
                              key={value}
                              onClick={() => isAvailable && handleAttributeSelect(attr.key, value)}
                              disabled={!isAvailable}
                              className={`
                                px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                                ${isSelected
                                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700'
                                }
                                ${!isAvailable && 'opacity-40 cursor-not-allowed line-through'}
                              `}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Short Description */}
                {product.shortDescription && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}

                {/* Quantity */}
                {isInStock && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-lg font-semibold min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(prev => Math.min(currentStock, prev + 1))}
                        disabled={quantity >= currentStock}
                        className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingBag size={18} />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={!isInStock}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 disabled:dark:bg-gray-600 text-white py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-md"
                  >
                    Buy Now
                  </button>
                </div>

                {/* View Full Details Link */}
                <button
                  onClick={handleViewFullDetails}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-amber-600 hover:text-amber-700 font-medium border border-gray-200 dark:border-gray-700 rounded-xl transition"
                >
                  <ExternalLink size={16} />
                  View Full Product Details
                </button>

                {/* Trust Badges */}
                <div className="flex justify-around py-4 border-t border-b border-gray-100 dark:border-gray-800">
                  {[
                    { icon: Truck, label: 'Free Shipping', desc: 'On orders ৳1500+' },
                    { icon: RotateCcw, label: 'Easy Returns', desc: '30 days return policy' },
                    { icon: Shield, label: 'Secure Checkout', desc: '100% secure payment' }
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <item.icon size={20} className="mx-auto mb-1 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex gap-6">
                    {[
                      { id: 'details', label: 'Details' },
                      { id: 'specs', label: 'Specifications' },
                      { id: 'reviews', label: `Reviews (${reviews.length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 text-sm font-medium transition relative ${activeTab === tab.id
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px] pb-6">
                  {activeTab === 'details' && (
                    <div className="space-y-3">
                      <div className={`relative ${!showFullDescription && product.description?.length > 300 ? 'max-h-32 overflow-hidden' : ''}`}>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {product.description || 'No description available.'}
                        </p>
                        {!showFullDescription && product.description && product.description.length > 300 && (
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
                        )}
                      </div>
                      {product.description && product.description.length > 300 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
                        >
                          {showFullDescription ? (
                            <>Show Less <ChevronUp size={14} /></>
                          ) : (
                            <>Read More <ChevronDown size={14} /></>
                          )}
                        </button>
                      )}

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {product.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="space-y-6">
                      {groupedSpecs.size > 0 ? (
                        Array.from(groupedSpecs.entries()).map(([groupName, specs]) => (
                          <div key={groupName}>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                              {groupName}
                            </h3>
                            <div className="space-y-2">
                              {specs.map((spec, idx) => (
                                <div key={idx} className="flex text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                                  <span className="w-1/2 text-gray-500 dark:text-gray-400">
                                    {spec.label || spec.key}
                                  </span>
                                  <span className="w-1/2 text-gray-900 dark:text-gray-200 font-medium">
                                    {typeof spec.value === 'boolean'
                                      ? (spec.value ? 'Yes' : 'No')
                                      : spec.value || 'N/A'
                                    }
                                    {spec.unit && ` ${spec.unit}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No specifications available for this product.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4">
                      {loadingReviews ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading reviews...</p>
                        </div>
                      ) : reviews.length > 0 ? (
                        <>
                          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {averageRating.toFixed(1)}
                              </div>
                              <div className="flex gap-0.5 my-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={i < Math.floor(averageRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                    }
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {displayedReviews.map((review) => (
                              <div key={review._id} className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold text-sm">
                                      {review.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                                        {review.name || 'Anonymous'}
                                      </p>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={12}
                                        className={i < review.rating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-gray-300 dark:text-gray-600'
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                  {review.comment}
                                </p>
                              </div>
                            ))}
                          </div>

                          {hasMoreReviews && (
                            <button
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-amber-600 hover:text-amber-700 font-medium transition border-t border-gray-200 dark:border-gray-700 mt-2"
                            >
                              {showAllReviews ? (
                                <>
                                  <ChevronUp size={16} />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  See All {reviews.length} Reviews
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                          <div className="text-4xl mb-3">💬</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No reviews yet</p>
                          <button
                            onClick={() => {
                              toast('Review feature coming soon');
                            }}
                            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                          >
                            Be the first to review
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}