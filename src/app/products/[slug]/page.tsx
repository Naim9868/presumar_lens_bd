import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySlug } from '@/app/actions/product.actions';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductVariantSelector } from '@/components/product/ProductVariantSelector';
import { ProductReviews } from '@/components/product/ProductReviews';
import { Star, Truck, ShieldCheck, RotateCcw, Heart, ShoppingBag } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const { product } = await getProductBySlug(resolvedParams.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }
  
  return {
    title: `${product.name} - Premium Collection`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product } = await getProductBySlug(params.slug);
  
  if (!product) {
    notFound();
  }
  
  const discountPercentage = product.originalPrice > product.discountPrice
    ? Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100)
    : 0;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-amber-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-amber-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{product.name}</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Images */}
        <div className="sticky top-24 h-fit">
          <ProductImageGallery images={product.images} productName={product.name} />
        </div>
        
        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Brand */}
          <Link href={`/brands/${product.brandId?.slug}`}>
            <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full hover:bg-amber-200 transition-colors">
              {product.brand}
            </span>
          </Link>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {product.name}
          </h1>
          
          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
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
              {product.soldCount}+ sold
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatPrice(product.discountPrice)}
            </span>
            {discountPercentage > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-sm font-semibold">
                  {discountPercentage}% OFF
                </span>
              </>
            )}
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Truck size={20} className="mx-auto mb-1 text-amber-600" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {product.freeShipping ? 'Free Shipping' : 'Shipping Fee Apply'}
              </p>
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
          
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>
          
          {/* Specs */}
          {product.specs && product.specs.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Specifications</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                {product.specs.map((spec, idx) => (
                  <div key={idx} className="flex border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="w-1/3 p-3 bg-gray-100 dark:bg-gray-800/50 font-medium text-sm">
                      {spec.label}
                    </div>
                    <div className="w-2/3 p-3 text-sm text-gray-700 dark:text-gray-300">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2">
              <ShoppingBag size={18} />
              Buy Now
            </button>
            
            <button className="flex-1 border-2 border-gray-300 dark:border-gray-700 hover:border-amber-500 hover:text-amber-600 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              <ShoppingBag size={18} />
              Add to Cart
            </button>
            
            <button className="px-6 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-rose-500 transition-all">
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 dark:text-green-400">
              In Stock • {product.stock} units available
            </span>
          </div>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              {product.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/products?tag=${tag}`}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-amber-100 hover:text-amber-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Customer Reviews
        </h2>
        <ProductReviews reviews={[]} productId={product._id} />
      </div>
    </div>
  );
}