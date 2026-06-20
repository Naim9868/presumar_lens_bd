'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Heart, 
  Share2, 
  Star, 
  StarHalf,
  Truck,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import BuyNowButton from '@/components/BuyNowButton';
import { IProduct, IProductVariant, IVariantAttribute } from '@/types/product';
import { useCartContext } from '@/app/context/CartContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Helper to convert variant attributes to Record<string, string>
const convertAttributesToRecord = (attributes: IVariantAttribute[]): Record<string, string> => {
  const result: Record<string, string> = {};
  attributes.forEach((attr) => {
    if (attr.key && attr.value !== undefined) {
      result[attr.key] = String(attr.value);
    }
  });
  return result;
};

// Helper to get variant display name
const getVariantDisplayName = (variant: IProductVariant): string => {
  if (variant.attributes && variant.attributes.length > 0) {
    return variant.attributes.map(attr => attr.value).join(' - ');
  }
  return variant.variantKey || 'Default';
};

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter();
  const { addToCart } = useCartContext();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        const response = await fetch(`/api/products/${params.slug}`);
        const data = await response.json();
        setProduct(data);
        
        // Set default variant
        const defaultVariant = data.variants?.find((v: IProductVariant) => v.isDefault) || data.variants?.[0];
        if (defaultVariant) {
          setSelectedVariant(defaultVariant);
        }
        
        // Set default image
        if (data.thumbnail) {
          setSelectedImage(data.thumbnail);
        } else if (data.imageGroups?.[0]?.images?.[0]) {
          const firstImage = data.imageGroups[0].images[0];
          setSelectedImage(typeof firstImage === 'string' ? firstImage : firstImage.url);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.slug]);

  // Mock product data for demonstration (remove this when you have real API)
  useEffect(() => {
    if (!product && !loading) {
      // Create mock product that matches IProduct interface
      const mockProduct: IProduct = {
        _id: '123',
        name: 'Premium Cotton T-Shirt',
        slug: params.slug,
        description: 'High-quality premium cotton t-shirt with excellent comfort and durability. Perfect for everyday wear.',
        shortDescription: 'Premium cotton t-shirt for everyday comfort',
        brandId: 'brand_123',
        categoryId: 'category_456',
        subcategoryId: 'sub_789',
        specificationGroups: [
          {
            groupName: 'Material',
            specifications: [
              { key: 'material', label: 'Material', value: '100% Cotton', filterable: true },
              { key: 'fit', label: 'Fit', value: 'Regular', filterable: true }
            ]
          }
        ],
        specsFlat: [
          { key: 'material', label: 'Material', value: '100% Cotton', filterable: true },
          { key: 'fit', label: 'Fit', value: 'Regular', filterable: true }
        ],
        variants: [
          {
            sku: 'SHIRT-S-BLUE',
            variantKey: 'S-BLUE',
            attributes: [
              { key: 'Size', value: 'S' },
              { key: 'Color', value: 'Blue' }
            ],
            price: 899,
            compareAtPrice: 1200,
            inventory: 50,
            reserved: 0,
            images: [],
            isDefault: true,
            status: 'in_stock'
          },
          {
            sku: 'SHIRT-M-BLUE',
            variantKey: 'M-BLUE',
            attributes: [
              { key: 'Size', value: 'M' },
              { key: 'Color', value: 'Blue' }
            ],
            price: 899,
            compareAtPrice: 1200,
            inventory: 45,
            reserved: 0,
            images: [],
            isDefault: false,
            status: 'in_stock'
          },
          {
            sku: 'SHIRT-L-BLUE',
            variantKey: 'L-BLUE',
            attributes: [
              { key: 'Size', value: 'L' },
              { key: 'Color', value: 'Blue' }
            ],
            price: 899,
            compareAtPrice: 1200,
            inventory: 30,
            reserved: 0,
            images: [],
            isDefault: false,
            status: 'in_stock'
          },
          {
            sku: 'SHIRT-S-RED',
            variantKey: 'S-RED',
            attributes: [
              { key: 'Size', value: 'S' },
              { key: 'Color', value: 'Red' }
            ],
            price: 899,
            compareAtPrice: 1200,
            inventory: 20,
            reserved: 0,
            images: [],
            isDefault: false,
            status: 'in_stock'
          }
        ],
        imageGroups: [
          {
            type: 'product',
            title: 'Product Images',
            images: [
              { url: '/images/shirt-1.jpg', alt: 'Front view', sortOrder: 0 },
              { url: '/images/shirt-2.jpg', alt: 'Back view', sortOrder: 1 },
              { url: '/images/shirt-3.jpg', alt: 'Detail view', sortOrder: 2 }
            ]
          }
        ],
        thumbnail: '/images/shirt-1.jpg',
        videos: [],
        tags: ['cotton', 'premium', 't-shirt'],
        badges: [
          { label: 'Best Seller', color: '#ff6b6b' },
          { label: 'Premium', color: '#4ecdc4' }
        ],
        relatedProducts: [],
        featured: true,
        searchBoost: 1,
        inventorySummary: {
          available: 145,
          reserved: 0,
          incoming: 0,
          lowStockThreshold: 10
        },
        lowestPrice: 899,
        highestPrice: 899,
        totalInventory: 145,
        ratingAverage: 4.5,
        ratingCount: 128,
        seo: {
          metaTitle: 'Premium Cotton T-Shirt',
          metaDescription: 'Buy premium cotton t-shirt online'
        },
        status: 'active',
        searchKeywords: ['t-shirt', 'cotton', 'premium'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProduct(mockProduct);
      setSelectedVariant(mockProduct.variants[0]);
      setSelectedImage(mockProduct.thumbnail || '/images/shirt-1.jpg');
    }
  }, [params.slug, product, loading]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) {
      toast.error('Product or variant not selected');
      return;
    }

    setIsAddingToCart(true);
    try {
      const success = await addToCart(product, selectedVariant, quantity);
      if (success) {
        toast.success('Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (selectedVariant && newQuantity > selectedVariant.inventory) {
      toast.error(`Only ${selectedVariant.inventory} items available`);
      return;
    }
    setQuantity(newQuantity);
  };

  const getVariantAttributes = (variant: IProductVariant): Record<string, string> => {
    return convertAttributesToRecord(variant.attributes || []);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="animate-pulse">
            <div className="w-full h-[400px] bg-gray-200 rounded-lg"></div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push('/products')}>
          Browse Products
        </Button>
      </div>
    );
  }

  // Get available variants grouped by attribute
  const getUniqueAttributeValues = (attributeKey: string): string[] => {
    const values = new Set<string>();
    product.variants.forEach((variant) => {
      const attrs = convertAttributesToRecord(variant.attributes || []);
      if (attrs[attributeKey]) {
        values.add(attrs[attributeKey]);
      }
    });
    return Array.from(values);
  };

  // Get all attribute keys
  const getAttributeKeys = (): string[] => {
    const keys = new Set<string>();
    product.variants.forEach((variant) => {
      const attrs = convertAttributesToRecord(variant.attributes || []);
      Object.keys(attrs).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  };

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <ShoppingBag className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Badges */}
            {product.badges && product.badges.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {product.badges.map((badge, index) => (
                  <Badge 
                    key={index}
                    style={{ backgroundColor: badge.color || '#000' }}
                    className="text-white"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.imageGroups && product.imageGroups.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {product.imageGroups[0]?.images.map((image, index) => {
                const imageUrl = typeof image === 'string' ? image : image.url;
                return (
                  <button
                    key={index}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                      selectedImage === imageUrl ? "border-primary" : "border-transparent hover:border-gray-300"
                    )}
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={typeof image === 'string' ? product.name : image.alt || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Title & Rating */}
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => {
                  const rating = product.ratingAverage || 0;
                  if (i < Math.floor(rating)) {
                    return <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />;
                  } else if (i < Math.ceil(rating) && rating % 1 !== 0) {
                    return <StarHalf key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />;
                  } else {
                    return <Star key={i} className="h-4 w-4 text-gray-300" />;
                  }
                })}
                <span className="text-sm text-muted-foreground ml-1">
                  ({product.ratingCount || 0} reviews)
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.totalInventory || 0} in stock
              </span>
            </div>
          </div>

          {/* Price */}
          <div>
            {selectedVariant ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(selectedVariant.price)}
                </span>
                {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(selectedVariant.compareAtPrice)}
                  </span>
                )}
                {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                  <Badge className="bg-green-500 text-white">
                    Save {formatCurrency(selectedVariant.compareAtPrice - selectedVariant.price)}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.lowestPrice || 0)}
                </span>
                {product.highestPrice && product.highestPrice > (product.lowestPrice || 0) && (
                  <span className="text-lg text-muted-foreground">
                    - {formatCurrency(product.highestPrice)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground">{product.shortDescription || product.description}</p>

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {getAttributeKeys().map((attributeKey) => (
                <div key={attributeKey}>
                  <label className="text-sm font-medium mb-2 block">
                    {attributeKey}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getUniqueAttributeValues(attributeKey).map((value) => {
                      const isSelected = selectedVariant && 
                        convertAttributesToRecord(selectedVariant.attributes || {})[attributeKey] === value;
                      
                      // Find a variant with this attribute value
                      const variantWithAttr = product.variants.find((v) => {
                        const attrs = convertAttributesToRecord(v.attributes || {});
                        return attrs[attributeKey] === value;
                      });
                      
                      const isAvailable = variantWithAttr && variantWithAttr.inventory > 0;
                      
                      return (
                        <button
                          key={`${attributeKey}-${value}`}
                          className={cn(
                            "px-4 py-2 border rounded-lg text-sm transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-400",
                            !isAvailable && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (!isAvailable) return;
                            const variant = product.variants.find((v) => {
                              const attrs = convertAttributesToRecord(v.attributes || {});
                              return attrs[attributeKey] === value;
                            });
                            if (variant) {
                              setSelectedVariant(variant);
                              setQuantity(1);
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Variant Info */}
          {selectedVariant && (
            <div className="text-sm text-muted-foreground">
              SKU: {selectedVariant.sku} | 
              Status: {selectedVariant.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center border rounded-lg">
              <button
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                className="px-3 py-2 hover:bg-gray-100 transition-colors"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={selectedVariant && quantity >= selectedVariant.inventory}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {selectedVariant && (
              <span className="text-sm text-muted-foreground">
                {selectedVariant.inventory} available
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 h-12"
              onClick={handleAddToCart}
              disabled={isAddingToCart || !selectedVariant}
            >
              {isAddingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>

            {/* Buy Now Button with Modal */}
            {selectedVariant && (
              <BuyNowButton
                product={product}
                variant={selectedVariant}
                quantity={quantity}
                buttonVariant="default"
                buttonSize="lg"
                className="flex-1 h-12"
                showModal={true}
              />
            )}

            <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <Truck className="h-6 w-6 mx-auto text-primary" />
              <p className="text-xs mt-1">Free Delivery</p>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto text-primary" />
              <p className="text-xs mt-1">Secure Payment</p>
            </div>
            <div className="text-center">
              <RefreshCw className="h-6 w-6 mx-auto text-primary" />
              <p className="text-xs mt-1">Easy Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              {product.specificationGroups && product.specificationGroups.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.specificationGroups.map((group, index) => (
                      <div key={index}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          {group.groupName}
                        </h4>
                        <div className="space-y-1">
                          {group.specifications.map((spec, specIndex) => (
                            <div key={specIndex} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{spec.label}</span>
                              <span>{String(spec.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}