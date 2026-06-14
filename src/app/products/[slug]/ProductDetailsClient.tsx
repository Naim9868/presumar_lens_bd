// src/app/products/[slug]/ProductDetailsClient.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  RotateCcw, 
  Shield,
  Minus,
  Plus,
  ChevronRight,
  Package,
  Eye,
  Check,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  IProduct, 
  IProductVariant, 
  IProductSpecification,
  IProductSpecificationGroup,
  IProductImageGroup,
  IProductBadge
} from '@/types/product';

// Extended product type with populated brand/category
interface EnrichedProduct extends IProduct {
  brand?: { _id: string; name: string; slug: string } | null;
  category?: { _id: string; name: string; slug: string } | null;
}

interface ProductDetailsClientProps {
  product: EnrichedProduct;
  relatedProducts: IProduct[];
}

// Helper functions
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Client Component: Image Gallery
const ImageGallery = ({ product }: { product: EnrichedProduct }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Collect all images
  const allImages = useMemo(() => {
    const images: Array<{ url: string; alt: string }> = [];
    
    // Add thumbnail
    if (product.thumbnail) {
      images.push({ url: product.thumbnail, alt: product.name });
    }
    
    // Add images from image groups
    if (product.imageGroups && product.imageGroups.length > 0) {
      product.imageGroups.forEach((group: IProductImageGroup) => {
        if (group.images && group.images.length > 0) {
          group.images.forEach(img => {
            if (img.url) {
              images.push({ url: img.url, alt: img.alt || group.title || product.name });
            }
          });
        }
      });
    }
    
    return images;
  }, [product]);

  const currentImage = allImages[selectedImage] || allImages[0];

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <Package className="w-20 h-20 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-zoom-in group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          className={`object-cover transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        
        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full">
          <Eye className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Thumbnail Grid */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {allImages.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === idx ? 'border-amber-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Client Component: Variant Selector
const VariantSelector = ({ 
  variants, 
  onVariantChange 
}: { 
  variants: IProductVariant[]; 
  onVariantChange: (variant: IProductVariant) => void;
}) => {
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant>(
    variants.find(v => v.isDefault === true) || variants[0]
  );
  
  // Group variants by attribute
  const attributes = useMemo(() => {
    const attrs: Record<string, string[]> = {};
    variants.forEach(variant => {
      variant.attributes?.forEach(attr => {
        if (!attrs[attr.key]) {
          attrs[attr.key] = [];
        }
        if (!attrs[attr.key].includes(attr.value)) {
          attrs[attr.key].push(attr.value);
        }
      });
    });
    return attrs;
  }, [variants]);

  const handleAttributeSelect = (key: string, value: string) => {
    const newVariant = variants.find(v => 
      v.attributes?.every(attr => {
        if (attr.key === key) return attr.value === value;
        const selectedAttr = selectedVariant.attributes?.find(a => a.key === attr.key);
        return selectedAttr?.value === attr.value;
      })
    );
    if (newVariant) {
      setSelectedVariant(newVariant);
      onVariantChange(newVariant);
    }
  };

  if (Object.keys(attributes).length === 0) return null;

  return (
    <div className="space-y-4">
      {Object.entries(attributes).map(([key, values]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
            Select {key}
          </label>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const isSelected = selectedVariant.attributes?.find(a => a.key === key)?.value === value;
              return (
                <button
                  key={value}
                  onClick={() => handleAttributeSelect(key, value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Client Component: Product Tabs
const ProductTabs = ({ product }: { product: EnrichedProduct }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const tabs = [
    { id: 'description' as const, label: 'Description' },
    { id: 'specifications' as const, label: 'Specifications' },
    { id: 'reviews' as const, label: `Reviews (${product.ratingCount || 0})` },
  ];

  const renderSpecValue = (spec: IProductSpecification) => {
    if (typeof spec.value === 'boolean') {
      return spec.value ? 'Yes' : 'No';
    }
    if (Array.isArray(spec.value)) {
      return spec.value.join(', ');
    }
    if (spec.value instanceof Date) {
      return spec.value.toLocaleDateString();
    }
    return spec.value || 'N/A';
  };

  return (
    <div className="mt-12">
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="space-y-6">
            {product.specificationGroups?.map((group: IProductSpecificationGroup, idx: number) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{group.groupName}</h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {group.specifications?.map((spec: IProductSpecification, specIdx: number) => (
                        <tr key={specIdx} className="border-b border-gray-200 last:border-b-0">
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3 bg-gray-50">
                            {spec.label}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {renderSpecValue(spec)}
                            {spec.unit && ` ${spec.unit}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {(!product.specificationGroups || product.specificationGroups.length === 0) && (
              <div className="text-center py-8 text-gray-500">No specifications available.</div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500">Be the first to review this product</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Client Component: Action Buttons
const ActionButtons = ({ 
  variant, 
  productId, 
  productSlug 
}: { 
  variant: IProductVariant | undefined; 
  productId: string; 
  productSlug: string;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const availableStock = variant ? variant.inventory - (variant.reserved || 0) : 0;
  const isInStock = variant && variant.status === 'in_stock' && availableStock > 0;

  const handleAddToCart = async () => {
    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }
    
    setIsAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success(`Added ${quantity} item(s) to cart`);
    setIsAddingToCart(false);
  };

  const handleAddToWishlist = async () => {
    setIsAddingToWishlist(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Added to wishlist');
    setIsAddingToWishlist(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${productSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {isInStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-lg font-semibold min-w-[40px] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))}
              disabled={quantity >= availableStock}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={handleAddToCart}
          disabled={!isInStock || isAddingToCart}
          className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAddingToCart ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShoppingCart className="w-5 h-5" />
          )}
          Add to Cart
        </button>
        <button 
          onClick={handleAddToWishlist}
          disabled={isAddingToWishlist}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Heart className={`w-5 h-5 ${isAddingToWishlist ? 'animate-pulse' : ''}`} />
          Wishlist
        </button>
        <button 
          onClick={handleShare}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </div>
  );
};

// Client Component: Breadcrumb
const Breadcrumb = ({ product }: { product: EnrichedProduct }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
      <Link href="/" className="text-gray-500 hover:text-amber-600 transition-colors">
        Home
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <Link href="/products" className="text-gray-500 hover:text-amber-600 transition-colors">
        Products
      </Link>
      {product.category && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link 
            href={`/categories/${product.category.slug}`} 
            className="text-gray-500 hover:text-amber-600 transition-colors"
          >
            {product.category.name}
          </Link>
        </>
      )}
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="text-gray-900 font-medium truncate">{product.name}</span>
    </nav>
  );
};

// Client Component: Related Products
const RelatedProducts = ({ products }: { products: IProduct[] }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link key={product._id} href={`/products/${product.slug}`} className="group">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {product.name}
                </h3>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(product.lowestPrice)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Main Client Component
export default function ProductDetailsClient({ product, relatedProducts }: ProductDetailsClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | undefined>(
    product.variants?.find(v => v.isDefault === true) || product.variants?.[0]
  );

  const currentVariant = selectedVariant || product.variants?.[0];
  const availableStock = currentVariant ? currentVariant.inventory - (currentVariant.reserved || 0) : 0;
  const isInStock = currentVariant && currentVariant.status === 'in_stock' && availableStock > 0 && product.status === 'active';
  
  // Get badge labels
  const badgeLabels = product.badges?.map((badge: IProductBadge) => badge.label) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb product={product} />

      {/* Product Main Section */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-6 lg:p-8">
          {/* Image Gallery */}
          <ImageGallery product={product} />

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <span className="text-sm text-gray-600">{product.brand.name}</span>
              </div>
            )}

            {/* Status Badge */}
            {product.status === 'active' ? (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <Check className="w-3 h-3" />
                Available
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                <X className="w-3 h-3" />
                {product.status === 'draft' ? 'Coming Soon' : 'Discontinued'}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            {product.ratingAverage > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.ratingAverage)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.ratingAverage} out of 5 ({product.ratingCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(currentVariant?.price || product.lowestPrice)}
              </span>
              {currentVariant?.compareAtPrice && currentVariant.compareAtPrice > (currentVariant?.price || 0) && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(currentVariant.compareAtPrice)}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                    Save {Math.round(((currentVariant.compareAtPrice - (currentVariant?.price || 0)) / currentVariant.compareAtPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Price Range for multi-variant products */}
            {product.variants && product.variants.length > 1 && product.highestPrice && product.highestPrice > product.lowestPrice && (
              <p className="text-sm text-gray-500">
                Price range: {formatPrice(product.lowestPrice)} - {formatPrice(product.highestPrice)}
              </p>
            )}

            {/* Short Description */}
            <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>

            {/* Badges */}
            {badgeLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badgeLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Variant Selector */}
            {product.variants && product.variants.length > 1 && (
              <VariantSelector 
                variants={product.variants} 
                onVariantChange={setSelectedVariant}
              />
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isInStock ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 font-medium">
                    In Stock ({availableStock} available)
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <ActionButtons 
              variant={currentVariant}
              productId={product._id}
              productSlug={product.slug}
            />

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Shipping Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-500">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">30 Day Returns</p>
                  <p className="text-xs text-gray-500">Money back guarantee</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure Checkout</p>
                  <p className="text-xs text-gray-500">SSL encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <ProductTabs product={product} />
      </div>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}