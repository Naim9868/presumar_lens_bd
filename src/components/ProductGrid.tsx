// app/components/ProductGrid.tsx
'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import ProperClothProductCard from './ProperClothProductCard';

// Updated sample data for electronics with proper structure
const sampleProducts = [
  {
    id: 1,
    name: "iPhone 16 Pro Max - 256GB",
    brand: "Apple",
    slug: "iphone-16-pro-max",
    rating: 4.9,
    reviewCount: 234,
    soldCount: 128,
    originalPrice: 165000,
    discountPrice: 147000,
    imageUrl: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2FkZ2V0fGVufDB8fDB8fHww",
    isAvailable: true,
    stock: 200,
    freeShipping: true,
    emiAvailable: true,
    warranty: "1 Year",
    badges: {
      isBestSeller: true,
      isPremium: true
    },
    specs: {
      processor: "A18 Pro",
      ram: "8GB",
      storage: "256GB",
      battery: "4674mAh",
      camera: "48MP Triple"
    }
  },
  {
    id: 2,
    name: "Sony A7 IV Mirrorless Camera",
    brand: "Sony",
    slug: "sony-a7-iv",
    rating: 4.8,
    reviewCount: 89,
    soldCount: 45,
    originalPrice: 245000,
    discountPrice: 225000,
    imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGdhZGdldHxlbnwwfHwwfHx8MA%3D%3D",
    isAvailable: true,
    stock: 32,
    freeShipping: true,
    emiAvailable: true,
    warranty: "2 Years",
    badges: {
      isBestSeller: true
    },
    specs: {
      processor: "BIONZ XR",
      ram: "N/A",
      storage: "CFexpress",
      camera: "33MP Full-frame"
    }
  },
  {
    id: 3,
    name: "DJI Mini 4 Pro Drone",
    brand: "DJI",
    slug: "dji-mini-4-pro",
    rating: 4.7,
    reviewCount: 156,
    soldCount: 67,
    originalPrice: 95000,
    discountPrice: 85000,
    imageUrl: "https://plus.unsplash.com/premium_photo-1673349178635-39b654f84401?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNhbWVyYSUyMGxlbnN8ZW58MHx8MHx8fDA%3D",
    isAvailable: true,
    stock: 59,
    freeShipping: true,
    emiAvailable: false,
    warranty: "6 Months",
    badges: {
      isNewArrival: true
    },
    specs: {
      battery: "34-min flight",
      camera: "4K/60fps"
    }
  },
  {
    id: 4,
    name: "Galaxy S24 Ultra 5G",
    brand: "Samsung",
    slug: "galaxy-s24-ultra",
    rating: 4.6,
    reviewCount: 312,
    soldCount: 203,
    originalPrice: 175000,
    discountPrice: 133500,
    imageUrl: "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z2FkZ2V0fGVufDB8fDB8fHww",
    isAvailable: false,
    stock: 0,
    freeShipping: true,
    emiAvailable: true,
    warranty: "2 Years",
    badges: {
      isPremium: true
    },
    specs: {
      processor: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "512GB",
      battery: "5000mAh",
      camera: "200MP Quad"
    }
  },
  {
    id: 5,
    name: "MacBook Pro M4 - 14-inch",
    brand: "Apple",
    slug: "macbook-pro-m4",
    rating: 4.9,
    reviewCount: 45,
    soldCount: 23,
    originalPrice: 199999,
    discountPrice: 199999,
    imageUrl: "https://images.unsplash.com/photo-1620783770629-122b7f187703?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z2FkZ2V0fGVufDB8fDB8fHww",
    isAvailable: true,
    stock: 2,
    freeShipping: true,
    emiAvailable: true,
    warranty: "1 Year",
    badges: {
      isLimitedStock: true,
      isPremium: true
    },
    specs: {
      processor: "M4 Chip",
      ram: "16GB",
      storage: "512GB SSD",
      battery: "Up to 22 hours"
    }
  },
  {
    id: 6,
    name: "OnePlus 12 - 512GB",
    brand: "OnePlus",
    slug: "oneplus-12",
    rating: 4.7,
    reviewCount: 178,
    soldCount: 94,
    originalPrice: 99999,
    discountPrice: 89999,
    imageUrl: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FtZXJhJTIwbGVuc3xlbnwwfHwwfHx8MA%3D%3D",
    isAvailable: true,
    stock: 12,
    freeShipping: true,
    emiAvailable: true,
    warranty: "1 Year",
    badges: {
      isBestSeller: true
    },
    specs: {
      processor: "Snapdragon 8 Gen 3",
      ram: "16GB",
      storage: "512GB",
      battery: "5400mAh",
      camera: "50MP Triple"
    }
  }
];

// Sample data for apparel (Proper Cloth)
const properClothProducts = [
  {
    id: "pc1001",
    name: "Royal Oxford Dress Shirt",
    brand: "Proper Cloth",
    slug: "royal-oxford-dress-shirt",
    rating: 4.8,
    reviewCount: 124,
    soldCount: 342,
    originalPrice: 139,
    discountPrice: 99,
    imageUrl: "/shirt1.jpg",
    fabricType: "Egyptian Cotton",
    thickness: "Midweight" as const,
    isBestSeller: true,
    sizesAvailable: ["XS", "S", "M", "L", "XL"]
  },
  // ... other apparel products
];

const ProductGrid = () => {
  const [activeTab, setActiveTab] = useState<'electronics' | 'apparel'>('electronics');

  const handleAddToCart = (id: string) => {
    console.log('Added to cart:', id);
  };

  const handleAddToWishlist = (id: string) => {
    console.log('Added to wishlist:', id);
  };

  const handleQuickView = (id: string) => {
    console.log('Quick view:', id);
  };

  const handleProperClothAddToCart = (id: string) => {
    console.log('Added Proper Cloth product to cart:', id);
  };

  const handleProperClothAddToWishlist = (id: string) => {
    console.log('Added Proper Cloth product to wishlist:', id);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Tabs */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Premium Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Discover handpicked premium products at unbeatable prices
          </p>
          
          {/* Category Tabs */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('electronics')}
              className={`px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                activeTab === 'electronics'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📱 Electronics & Gadgets
            </button>
            <button
              onClick={() => setActiveTab('apparel')}
              className={`px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                activeTab === 'apparel'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              👔 Premium Apparel
            </button>
          </div>
        </div>
        
        {/* Products Grid - Electronics */}
        {activeTab === 'electronics' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
            {sampleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}
        
        {/* Products Grid - Apparel */}
        {activeTab === 'apparel' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properClothProducts.map((product) => (
              <ProperClothProductCard
                key={product.id}
                product={product}
                onAddToCart={handleProperClothAddToCart}
                onAddToWishlist={handleProperClothAddToWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;