// app/components/FeaturedProducts.tsx
'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, ArrowRight} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
}

const FeaturedProducts = () => {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  
  const products: Product[] = [
    {
      id: 1,
      name: "Premium Blue Light Blocking Glasses",
      price: 89.99,
      originalPrice: 129.99,
      rating: 4.8,
      reviews: 234,
      image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2FkZ2V0fGVufDB8fDB8fHww",
      badge: "Best Seller"
    },
    {
      id: 2,
      name: "Designer Sunglasses - Amber Edition",
      price: 149.99,
      rating: 4.9,
      reviews: 189,
      image: "/product2.jpg",
      badge: "New"
    },
    {
      id: 3,
      name: "Polarized Sports Sunglasses",
      price: 129.99,
      originalPrice: 179.99,
      rating: 4.7,
      reviews: 456,
      image: "/product3.jpg",
      badge: "-28%"
    },
    {
      id: 4,
      name: "Reading Glasses - Classic Gold",
      price: 59.99,
      rating: 4.6,
      reviews: 123,
      image: "/product4.jpg",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Collections
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular eyewear pieces, curated for style and performance
          </p>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div 
              key={product.id}
              className="group relative bg-white border border-gray-200  hover:shadow-xl transition-all duration-300 overflow-hidden"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Product Badge */}
              {product.badge && (
                <div className="absolute top-3 left-3 z-10">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    product.badge === "Best Seller" 
                      ? "bg-amber-500 text-white"
                      : product.badge === "New"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}>
                    {product.badge}
                  </span>
                </div>
              )}
              
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400">Product Image</span>
                </div>
                {/* Action Buttons - Appear on Hover */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                  hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <button className="p-2 bg-white rounded-full hover:bg-amber-500 hover:text-white transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-white rounded-full hover:bg-amber-500 hover:text-white transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-800 hover:text-amber-600 transition-colors mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${
                        i < Math.floor(product.rating) 
                          ? 'text-amber-500 fill-amber-500' 
                          : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.reviews})</span>
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-amber-600">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* View All Button */}
        <div className="text-center mt-12">
          <Link 
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-amber-600 text-amber-600 font-semibold rounded-full hover:bg-amber-600 hover:text-white transition-all duration-200"
          >
            View All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;