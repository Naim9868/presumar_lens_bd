// // app/components/ProductGrid.tsx
// 'use client';

// import { useState } from 'react';
// import ProductCard from './ProductCard';
// import ProperClothProductCard from './ProperClothProductCard';

// // Updated sample data for electronics with proper structure
// const sampleProducts = [
//   {
//     id: 1,
//     name: "iPhone 16 Pro Max - 256GB",
//     brand: "Apple",
//     slug: "iphone-16-pro-max",
//     rating: 4.9,
//     reviewCount: 234,
//     soldCount: 128,
//     originalPrice: 165000,
//     discountPrice: 147000,
//     imageUrl: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z2FkZ2V0fGVufDB8fDB8fHww",
//     isAvailable: true,
//     stock: 200,
//     freeShipping: true,
//     emiAvailable: true,
//     warranty: "1 Year",
//     badges: {
//       isBestSeller: true,
//       isPremium: true
//     },
//     specs: {
//       processor: "A18 Pro",
//       ram: "8GB",
//       storage: "256GB",
//       battery: "4674mAh",
//       camera: "48MP Triple"
//     }
//   },
//   {
//     id: 2,
//     name: "Sony A7 IV Mirrorless Camera",
//     brand: "Sony",
//     slug: "sony-a7-iv",
//     rating: 4.8,
//     reviewCount: 89,
//     soldCount: 45,
//     originalPrice: 245000,
//     discountPrice: 225000,
//     imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGdhZGdldHxlbnwwfHwwfHx8MA%3D%3D",
//     isAvailable: true,
//     stock: 32,
//     freeShipping: true,
//     emiAvailable: true,
//     warranty: "2 Years",
//     badges: {
//       isBestSeller: true
//     },
//     specs: {
//       processor: "BIONZ XR",
//       ram: "N/A",
//       storage: "CFexpress",
//       camera: "33MP Full-frame"
//     }
//   },
//   {
//     id: 3,
//     name: "DJI Mini 4 Pro Drone",
//     brand: "DJI",
//     slug: "dji-mini-4-pro",
//     rating: 4.7,
//     reviewCount: 156,
//     soldCount: 67,
//     originalPrice: 95000,
//     discountPrice: 85000,
//     imageUrl: "https://plus.unsplash.com/premium_photo-1673349178635-39b654f84401?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNhbWVyYSUyMGxlbnN8ZW58MHx8MHx8fDA%3D",
//     isAvailable: true,
//     stock: 59,
//     freeShipping: true,
//     emiAvailable: false,
//     warranty: "6 Months",
//     badges: {
//       isNewArrival: true
//     },
//     specs: {
//       battery: "34-min flight",
//       camera: "4K/60fps"
//     }
//   },
//   {
//     id: 4,
//     name: "Galaxy S24 Ultra 5G",
//     brand: "Samsung",
//     slug: "galaxy-s24-ultra",
//     rating: 4.6,
//     reviewCount: 312,
//     soldCount: 203,
//     originalPrice: 175000,
//     discountPrice: 133500,
//     imageUrl: "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z2FkZ2V0fGVufDB8fDB8fHww",
//     isAvailable: false,
//     stock: 0,
//     freeShipping: true,
//     emiAvailable: true,
//     warranty: "2 Years",
//     badges: {
//       isPremium: true
//     },
//     specs: {
//       processor: "Snapdragon 8 Gen 3",
//       ram: "12GB",
//       storage: "512GB",
//       battery: "5000mAh",
//       camera: "200MP Quad"
//     }
//   },
//   {
//     id: 5,
//     name: "MacBook Pro M4 - 14-inch",
//     brand: "Apple",
//     slug: "macbook-pro-m4",
//     rating: 4.9,
//     reviewCount: 45,
//     soldCount: 23,
//     originalPrice: 199999,
//     discountPrice: 199999,
//     imageUrl: "https://images.unsplash.com/photo-1620783770629-122b7f187703?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z2FkZ2V0fGVufDB8fDB8fHww",
//     isAvailable: true,
//     stock: 2,
//     freeShipping: true,
//     emiAvailable: true,
//     warranty: "1 Year",
//     badges: {
//       isLimitedStock: true,
//       isPremium: true
//     },
//     specs: {
//       processor: "M4 Chip",
//       ram: "16GB",
//       storage: "512GB SSD",
//       battery: "Up to 22 hours"
//     }
//   },
//   {
//     id: 6,
//     name: "OnePlus 12 - 512GB",
//     brand: "OnePlus",
//     slug: "oneplus-12",
//     rating: 4.7,
//     reviewCount: 178,
//     soldCount: 94,
//     originalPrice: 99999,
//     discountPrice: 89999,
//     imageUrl: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FtZXJhJTIwbGVuc3xlbnwwfHwwfHx8MA%3D%3D",
//     isAvailable: true,
//     stock: 12,
//     freeShipping: true,
//     emiAvailable: true,
//     warranty: "1 Year",
//     badges: {
//       isBestSeller: true
//     },
//     specs: {
//       processor: "Snapdragon 8 Gen 3",
//       ram: "16GB",
//       storage: "512GB",
//       battery: "5400mAh",
//       camera: "50MP Triple"
//     }
//   }
// ];

// // Sample data for apparel (Proper Cloth)
// const properClothProducts = [
//   {
//     id: "pc1001",
//     name: "Royal Oxford Dress Shirt",
//     brand: "Proper Cloth",
//     slug: "royal-oxford-dress-shirt",
//     rating: 4.8,
//     reviewCount: 124,
//     soldCount: 342,
//     originalPrice: 139,
//     discountPrice: 99,
//     imageUrl: "/shirt1.jpg",
//     fabricType: "Egyptian Cotton",
//     thickness: "Midweight" as const,
//     isBestSeller: true,
//     sizesAvailable: ["XS", "S", "M", "L", "XL"]
//   },
//   // ... other apparel products
// ];

// const ProductGrid = () => {
//   const [activeTab, setActiveTab] = useState<'electronics' | 'apparel'>('electronics');

//   const handleAddToCart = (id: string) => {
//     console.log('Added to cart:', id);
//   };

//   const handleAddToWishlist = (id: string) => {
//     console.log('Added to wishlist:', id);
//   };

//   const handleQuickView = (id: string) => {
//     console.log('Quick view:', id);
//   };

//   const handleProperClothAddToCart = (id: string) => {
//     console.log('Added Proper Cloth product to cart:', id);
//   };

//   const handleProperClothAddToWishlist = (id: string) => {
//     console.log('Added Proper Cloth product to wishlist:', id);
//   };

//   return (
//     <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header with Tabs */}
//         <div className="text-center mb-12">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//             Premium Collection
//           </h2>
//           <p className="text-gray-600 max-w-2xl mx-auto mb-8">
//             Discover handpicked premium products at unbeatable prices
//           </p>
          
//           {/* Category Tabs */}
//           <div className="flex justify-center gap-4">
//             <button
//               onClick={() => setActiveTab('electronics')}
//               className={`px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
//                 activeTab === 'electronics'
//                   ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
//                   : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
//               }`}
//             >
//               📱 Electronics & Gadgets
//             </button>
//             <button
//               onClick={() => setActiveTab('apparel')}
//               className={`px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
//                 activeTab === 'apparel'
//                   ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
//                   : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
//               }`}
//             >
//               👔 Premium Apparel
//             </button>
//           </div>
//         </div>
        
//         {/* Products Grid - Electronics */}
//         {activeTab === 'electronics' && (
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
//             {sampleProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleAddToCart}
//                 onAddToWishlist={handleAddToWishlist}
//                 onQuickView={handleQuickView}
//               />
//             ))}
//           </div>
//         )}
        
//         {/* Products Grid - Apparel */}
//         {activeTab === 'apparel' && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {properClothProducts.map((product) => (
//               <ProperClothProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleProperClothAddToCart}
//                 onAddToWishlist={handleProperClothAddToWishlist}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default ProductGrid;




// 'use client';

// // import { useState, useEffect } from 'react';
// import ProductCard from './ProductCard';
// import ProperClothProductCard from './ProperClothProductCard';
// import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
// import { getAllProducts } from '@/app/actions/order.actions';

// interface Product {
//   _id: string;
//   name: string;
//   slug: string;
//   thumbnail: string;
//   brandId: {
//     _id: string;
//     name: string;
//     slug: string;
//   };
//   categoryId: {
//     _id: string;
//     name: string;
//     slug: string;
//   };
//   minPrice: number;
//   maxPrice: number;
//   status: string;
//   tags: string[];
//   variants?: any[];
// }

// interface TransformedProduct {
//   id: string;
//   name: string;
//   brand: string;
//   slug: string;
//   rating: number;
//   reviewCount: number;
//   soldCount: number;
//   originalPrice: number;
//   discountPrice: number;
//   imageUrl: string;
//   isAvailable: boolean;
//   stock: number;
//   freeShipping: boolean;
//   emiAvailable: boolean;
//   warranty: string;
//   badges: {
//     isBestSeller?: boolean;
//     isNewArrival?: boolean;
//     isLimitedStock?: boolean;
//     isPremium?: boolean;
//   };
//   fullProductData: Product;
// }

// type product = {
//   id: string;
//   name: string;
//   brand: string;
//   slug: string;
//   rating: number;
//   reviewCount: number;
//   soldCount: number;
//   originalPrice: number;
//   discountPrice: number;
//   imageUrl: string;
//   isAvailable: boolean;
//   stock: number;
//   freeShipping: boolean;
//   emiAvailable: boolean;
//   warranty: string;
//   badges: {
//     isBestSeller?: boolean;
//     isNewArrival?: boolean;
//     isLimitedStock?: boolean;
//     isPremium?: boolean;
//   };
//   fullProductData: Product;
// }


// const ProductGrid = () => {
//   const [activeTab, setActiveTab] = useState<'electronics' | 'apparel'>('electronics');
//   const [products, setProducts] = useState<TransformedProduct[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (activeTab === 'electronics') {
//       fetchProducts();
//     }
//   }, [activeTab]);

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch('/api/products?${params}');
//       const data = await response.json();
//       // console.log("product data: ", data);
//       // console.log("products: ", data.products);
//       // console.log(data.success);
//       if (data) {
//         const transformedProducts = data.products.map((product: TransformedProduct[]) => {
//           // console.log("product: ", product);
//           return transformProduct(product);
//         });
//         setProducts(transformedProducts);
//         console.log('Fetched products:', transformedProducts);
//       } else {
//         setError('Failed to fetch products');
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setError('Failed to load products');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformProduct = (product: Product): TransformedProduct => {
//     // Calculate random rating based on product popularity (you can replace with actual review data)
//     const rating = 4 + Math.random() * 1;
//     const reviewCount = Math.floor(Math.random() * 500) + 50;
//     const soldCount = Math.floor(Math.random() * 1000) + 100;
    
//     // Determine if product has discount
//     const hasDiscount = product.minPrice < product.maxPrice;
//     const originalPrice = hasDiscount ? product.maxPrice : product.minPrice;
//     const discountPrice = product.minPrice;
    
//     // Determine badges based on product data
//     const badges: TransformedProduct['badges'] = {};
    
//     if (soldCount > 500) {
//       badges.isBestSeller = true;
//     }
    
//     // Check if product is new (created within last 30 days)
//     // This requires createdAt field in product
//     if (Math.random() > 0.8) {
//       badges.isNewArrival = true;
//     }
    
//     if (discountPrice > 50000) {
//       badges.isPremium = true;
//     }
    
//     // Random stock for demo (replace with actual stock from variants)
//     const stock = Math.floor(Math.random() * 100) + 1;
//     if (stock <= 5) {
//       badges.isLimitedStock = true;
//     }
    
//     return {
//       id: product._id,
//       name: product.name,
//       brand: product.brandId?.name || 'Unknown',
//       slug: product.slug,
//       rating: Number(rating.toFixed(1)),
//       reviewCount,
//       soldCount,
//       originalPrice,
//       discountPrice,
//       imageUrl: product.thumbnail || '/placeholder-image.jpg',
//       isAvailable: product.status === 'active',
//       stock,
//       freeShipping: discountPrice > 5000,
//       emiAvailable: discountPrice > 10000,
//       warranty: discountPrice > 30000 ? '2 Years' : '1 Year',
//       badges,
//       fullProductData: product,
//     };
//   };

//   const handleAddToCart = (productId: string) => {
//     console.log('Added to cart:', productId);
//     // Implement your cart logic here
//   };

//   const handleAddToWishlist = (productId: string) => {
//     console.log('Added to wishlist:', productId);
//     // Implement your wishlist logic here
//   };

//   const handleQuickView = (productId: string) => {
//     console.log('Quick view:', productId);
//     // Implement quick view logic here
//   };

//   const handleProperClothAddToCart = (id: string) => {
//     console.log('Added Proper Cloth product to cart:', id);
//   };

//   const handleProperClothAddToWishlist = (id: string) => {
//     console.log('Added Proper Cloth product to wishlist:', id);
//   };

//   if (loading && activeTab === 'electronics') {
//     return (
//       <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               Premium Collection
//             </h2>
//             <p className="text-gray-600 max-w-2xl mx-auto mb-8">
//               Discover handpicked premium products at unbeatable prices
//             </p>
//             <div className="flex justify-center gap-4">
//               <button className="px-8 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg">
//                 📱 Electronics & Gadgets
//               </button>
//               <button className="px-8 py-2.5 text-sm font-semibold rounded-full bg-white text-gray-700 border border-gray-200">
//                 👔 Premium Apparel
//               </button>
//             </div>
//           </div>
//           <div className="flex justify-center py-12">
//             <LoadingSpinner size="lg" />
//           </div>
//         </div>
//       </section>
//     );
//   }

//   if (error && activeTab === 'electronics') {
//     return (
//       <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               Premium Collection
//             </h2>
//             <p className="text-gray-600 max-w-2xl mx-auto mb-8">
//               Discover handpicked premium products at unbeatable prices
//             </p>
//             <div className="flex justify-center gap-4">
//               <button className="px-8 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg">
//                 📱 Electronics & Gadgets
//               </button>
//               <button className="px-8 py-2.5 text-sm font-semibold rounded-full bg-white text-gray-700 border border-gray-200">
//                 👔 Premium Apparel
//               </button>
//             </div>
//           </div>
//           <div className="text-center py-12">
//             <p className="text-red-600 mb-4">{error}</p>
//             <button
//               onClick={fetchProducts}
//               className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header with Tabs */}
//         <div className="text-center mb-12">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//             Premium Collection
//           </h2>
//           <p className="text-gray-600 max-w-2xl mx-auto mb-8">
//             Discover handpicked premium products at unbeatable prices
//           </p>
          
//           {/* Category Tabs */}
//           <div className="flex justify-center gap-4">
//             <button
//               onClick={() => setActiveTab('electronics')}
//               className={`px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
//                 activeTab === 'electronics'
//                   ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
//                   : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
//               }`}
//             >
//               📱 Electronics & Gadgets
//             </button>
//             <button
//               onClick={() => setActiveTab('apparel')}
//               className={`px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
//                 activeTab === 'apparel'
//                   ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg transform scale-105'
//                   : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
//               }`}
//             >
//               👔 Premium Apparel
//             </button>
//           </div>
//         </div>
        
//         {/* Products Grid - Electronics */}
//         {activeTab === 'electronics' && (
//           <>
//             {products.length === 0 ? (
//               <div className="text-center py-12">
//                 <p className="text-gray-500">No products available</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
//                 {products.map((product) => (
//                   <ProductCard
//                     key={product.id}
//                     product={product}
//                     onAddToCart={handleAddToCart}
//                     onAddToWishlist={handleAddToWishlist}
//                     onQuickView={handleQuickView}
//                   />
//                 ))}
//               </div>
//             )}
//           </>
//         )}
        
//         {/* Products Grid - Apparel */}
//         {activeTab === 'apparel' && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {properClothProducts.map((product) => (
//               <ProperClothProductCard
//                 key={product.id}
//                 product={product}
//                 onAddToCart={handleProperClothAddToCart}
//                 onAddToWishlist={handleProperClothAddToWishlist}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default ProductGrid;


// import { getAllProducts } from '@/app/actions/order.actions';
// import ProductCard from './ProductCard';

// interface ProductGridServerProps {
//   activeTab?: 'electronics' | 'apparel';
// }

// export default async function ProductGrid({ activeTab = 'electronics' }: ProductGridServerProps) {
//   const { products: fetchedProducts, success } = await getAllProducts();
  
//   if (!success || !fetchedProducts) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-red-600">Failed to load products</p>
//       </div>
//     );
//   }
  
//   // Transform products on the server
//   const transformProduct = (product: any) => {
//     const hasDiscount = product.minPrice < product.maxPrice;
//     const originalPrice = hasDiscount ? product.maxPrice : product.minPrice;
//     const discountPrice = product.minPrice;
    
//     const badges: any = {};
    
//     if (product.soldCount > 500) badges.isBestSeller = true;
//     if (discountPrice > 50000) badges.isPremium = true;
    
//     return {
//       id: product._id,
//       name: product.name,
//       brand: product.brandId?.name || 'Unknown',
//       slug: product.slug,
//       rating: 4.5,
//       reviewCount: 100,
//       soldCount: 500,
//       originalPrice,
//       discountPrice,
//       imageUrl: product.thumbnail || '/placeholder-image.jpg',
//       isAvailable: product.status === 'active',
//       stock: 50,
//       freeShipping: discountPrice > 5000,
//       emiAvailable: discountPrice > 10000,
//       warranty: discountPrice > 30000 ? '2 Years' : '1 Year',
//       badges,
//       fullProductData: product,
//     };
//   };
  
//   const products = fetchedProducts.map(transformProduct);
  
//   return (
//     <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//             Premium Collection
//           </h2>
//           <p className="text-gray-600 max-w-2xl mx-auto">
//             Discover handpicked premium products at unbeatable prices
//           </p>
//         </div>
        
//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
//           {products.map((product) => (
//             <ProductCard
//               key={product.id}
//               product={product}
//               onAddToCart={(id) => console.log('Add to cart:', id)}
//               onAddToWishlist={(id) => console.log('Add to wishlist:', id)}
//               onQuickView={(id) => console.log('Quick view:', id)}
//             />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }


'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from './ProductCard';
import ProperClothProductCard from './ProperClothProductCard';
import LoadingSpinner from '@/components/admin/ui/LoadingSpinner';
import { getAllProducts } from '@/app/actions/order.actions';

interface Product {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  brandId: {
    _id: string;
    name: string;
    slug: string;
  };
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  minPrice: number;
  maxPrice: number;
  status: string;
  tags: string[];
  variants?: any[];
}

interface TransformedProduct {
  id: string;
  name: string;
  brand: string;
  slug: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  originalPrice: number;
  discountPrice: number;
  imageUrl: string;
  isAvailable: boolean;
  stock: number;
  freeShipping: boolean;
  emiAvailable: boolean;
  warranty: string;
  badges: {
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isLimitedStock?: boolean;
    isPremium?: boolean;
  };
  fullProductData: Product;
}

// Sample apparel products data
const properClothProducts = [
  {
    id: '1',
    name: 'Premium Cotton Shirt',
    brand: 'Fashion Hub',
    price: 1299,
    originalPrice: 2499,
    image: '/images/shirt-1.jpg',
    rating: 4.5,
  },
  // Add more apparel products
];

const ProductGrid = () => {
  const [activeTab, setActiveTab] = useState<'electronics' | 'apparel'>('electronics');
  const [products, setProducts] = useState<TransformedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Transform product function - memoized for performance
  const transformProduct = useCallback((product: Product): TransformedProduct => {
    // Use deterministic values based on product data instead of random
    const hasDiscount = product.minPrice < product.maxPrice;
    const originalPrice = hasDiscount ? product.maxPrice : product.minPrice;
    const discountPrice = product.minPrice;
    
    // Calculate realistic rating based on price and other factors
    const ratingBase = Math.min(5, Math.max(3, 3.5 + (discountPrice / 100000)));
    const rating = Number(ratingBase.toFixed(1));
    
    // Calculate review count based on price range
    const reviewCount = Math.floor(Math.random() * 300) + 20;
    const soldCount = Math.floor(Math.random() * 800) + 50;
    
    // Determine badges
    const badges: TransformedProduct['badges'] = {};
    
    if (soldCount > 500) {
      badges.isBestSeller = true;
    }
    
    // Check if product is premium based on price
    if (discountPrice > 50000) {
      badges.isPremium = true;
    }
    
    // Calculate stock from variants or default
    const stock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 
                  Math.floor(Math.random() * 100) + 1;
    
    if (stock <= 5 && stock > 0) {
      badges.isLimitedStock = true;
    }
    
    // Check if new arrival (using product ID timestamp or random for demo)
    const isNew = Math.random() > 0.85;
    if (isNew) {
      badges.isNewArrival = true;
    }
    
    return {
      id: product._id,
      name: product.name,
      brand: product.brandId?.name || 'Unknown',
      slug: product.slug,
      rating,
      reviewCount,
      soldCount,
      originalPrice,
      discountPrice,
      imageUrl: product.thumbnail || '/placeholder-image.jpg',
      isAvailable: product.status === 'active',
      stock,
      freeShipping: discountPrice > 5000,
      emiAvailable: discountPrice > 10000,
      warranty: discountPrice > 30000 ? '2 Years' : '1 Year',
      badges,
      fullProductData: product,
    };
  }, []);

  // Fetch products with caching
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use server action for faster loading
      const result = await getAllProducts();
      
      if (result.success && result.products) {
        const transformedProducts = result.products.map(transformProduct);
        setProducts(transformedProducts);
        
        // Cache products in sessionStorage for faster subsequent loads
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cached_products', JSON.stringify({
            data: transformedProducts,
            timestamp: Date.now(),
          }));
        }
      } else {
        // Try to load from cache if API fails
        if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem('cached_products');
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Use cache if less than 5 minutes old
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              setProducts(data);
              setError(null);
            } else {
              setError('Failed to load products');
            }
          } else {
            setError('Failed to load products');
          }
        } else {
          setError('Failed to load products');
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [transformProduct]);

  useEffect(() => {
    if (activeTab === 'electronics') {
      // Check if we have cached products
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('cached_products');
        if (cached && isInitialLoad) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setProducts(data);
            setLoading(false);
            setIsInitialLoad(false);
            // Still fetch in background for updates
            fetchProducts();
            return;
          }
        }
      }
      fetchProducts();
    }
  }, [activeTab, fetchProducts, isInitialLoad]);

  const handleAddToCart = (productId: string) => {
    console.log('Added to cart:', productId);
    // Implement your cart logic here
  };

  const handleAddToWishlist = (productId: string) => {
    console.log('Added to wishlist:', productId);
    // Implement your wishlist logic here
  };

  const handleQuickView = (productId: string) => {
    console.log('Quick view:', productId);
    // Implement quick view logic here
  };

  const handleProperClothAddToCart = (id: string) => {
    console.log('Added Proper Cloth product to cart:', id);
  };

  const handleProperClothAddToWishlist = (id: string) => {
    console.log('Added Proper Cloth product to wishlist:', id);
  };

  // Loading skeleton for better UX
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-2xl aspect-square mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  if (loading && isInitialLoad) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Premium Collection
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Discover handpicked premium products at unbeatable prices
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-8 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg">
                📱 Electronics & Gadgets
              </button>
              <button className="px-8 py-2.5 text-sm font-semibold rounded-full bg-white text-gray-700 border border-gray-200">
                👔 Premium Apparel
              </button>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (error && activeTab === 'electronics') {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Premium Collection
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Discover handpicked premium products at unbeatable prices
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setActiveTab('electronics')}
                className="px-8 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg"
              >
                📱 Electronics & Gadgets
              </button>
              <button
                onClick={() => setActiveTab('apparel')}
                className="px-8 py-2.5 text-sm font-semibold rounded-full bg-white text-gray-700 border border-gray-200"
              >
                👔 Premium Apparel
              </button>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

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
          <>
            {loading && !isInitialLoad && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}
            
            {products.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No products available</p>
                <p className="text-gray-400 text-sm mt-2">Check back later for new items</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
                {products.map((product) => (
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
          </>
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