// // app/components/ProductCard.tsx
// 'use client';

// import { useState } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { Star, Package, Heart, Eye, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

// interface Product {
//   id: string | number;
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
//   stock?: number;
//   freeShipping?: boolean;
//   warranty?: string;
//   emiAvailable?: boolean;
//   badges?: {
//     isBestSeller?: boolean;
//     isNewArrival?: boolean;
//     isLimitedStock?: boolean;
//     isPremium?: boolean;
//   };
// }

// interface ProductCardProps {
//   product: Product;
//   onAddToCart?: (productId: string) => void;
//   onAddToWishlist?: (productId: string) => void;
//   onQuickView?: (productId: string) => void;
// }

// const ProductCard = ({ 
//   product, 
//   onAddToCart, 
//   onAddToWishlist,
//   onQuickView 
// }: ProductCardProps) => {
//   const [isHovered, setIsHovered] = useState(false);
//   const [isWishlisted, setIsWishlisted] = useState(false);
//   const [imageError, setImageError] = useState(false);

//   const discountPercentage = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
//   const hasDiscount = product.discountPrice < product.originalPrice;
//   const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 10;
//   const isInStock = product.isAvailable && (product.stock === undefined || product.stock > 0);

//   const formatPrice = (price: number) => {
//     const currency = price > 1000 ? 'BDT' : 'USD';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currency,
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(price);
//   };

//   const getStockStatus = () => {
//     if (!isInStock) {
//       return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
//     }
//     if (isLowStock) {
//       return { text: `Only ${product.stock} left`, color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
//     }
//     return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
//   };

//   const stockStatus = getStockStatus();
//   const StockIcon = stockStatus.icon;

//   const renderStars = () => {
//     const fullStars = Math.floor(product.rating);
//     const hasHalfStar = product.rating % 1 >= 0.5;
    
//     return (
//       <div className="flex items-center gap-0.5">
//         {[...Array(5)].map((_, i) => (
//           <Star
//             key={i}
//             className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
//               i < fullStars 
//                 ? 'text-amber-500 fill-amber-500' 
//                 : i === fullStars && hasHalfStar
//                 ? 'text-amber-500 fill-amber-500 opacity-50'
//                 : 'text-gray-300'
//             }`}
//           />
//         ))}
//         <span className="text-[10px] sm:text-xs text-gray-600 ml-1">({product.reviewCount})</span>
//       </div>
//     );
//   };

//   return (
//     <div 
//       className="group relative bg-white rounded-[8px] hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200"
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {/* Image Section */}
//       <Link href={`/product/${product.slug}`} className="block relative overflow-hidden bg-gray-100">
//         <div className="relative aspect-square">
//           {product.imageUrl && !imageError ? (
//             <Image
//               src={product.imageUrl}
//               alt={product.name}
//               fill
//               sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
//               className="object-cover transition-transform duration-500 group-hover:scale-105"
//               onError={() => setImageError(true)}
//               priority={false}
//             />
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
//               <div className="text-center">
//                 <Package className="w-8 h-8 mx-auto mb-1 opacity-50" />
//                 <span className="text-xs">No Image</span>
//               </div>
//             </div>
//           )}
          
//           {/* Badges */}
//           <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
//             {product.badges?.isBestSeller && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-amber-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm">
//                 BESTSELLER
//               </span>
//             )}
//             {product.badges?.isNewArrival && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-blue-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm">
//                 NEW
//               </span>
//             )}
//             {isLowStock && product.badges?.isLimitedStock && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm animate-pulse">
//                 ⚡ LIMITED
//               </span>
//             )}
//             {product.badges?.isPremium && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm">
//                 PREMIUM
//               </span>
//             )}
//           </div>
          
//           {/* Discount Badge */}
//           {hasDiscount && (
//             <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
//               <div className="bg-red-500 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex flex-col items-center justify-center shadow-lg">
//                 <span className="text-white font-bold text-xs sm:text-sm">{discountPercentage}%</span>
//                 <span className="text-white text-[6px] sm:text-[8px] -mt-0.5">OFF</span>
//               </div>
//             </div>
//           )}
          
//           {/* Out of Stock Overlay */}
//           {!isInStock && (
//             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
//               <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 text-gray-800 font-semibold rounded-full text-xs sm:text-sm shadow-lg">
//                 Out of Stock
//               </span>
//             </div>
//           )}
          
//           {/* Quick Action Buttons */}
//           <div className={`absolute inset-x-0 bottom-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent transform transition-all duration-300 z-10 ${
//             isHovered && isInStock ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
//           }`}>
//             <div className="flex gap-1.5 sm:gap-2">
//               <button
//                 onClick={() => onAddToCart?.(product.id.toString())}
//                 disabled={!isInStock}
//                 className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg text-xs sm:text-sm"
//               >
//                 <Package className="w-3 h-3 sm:w-4 sm:h-4" />
//                 <span className="hidden xs:inline">Add to Cart</span>
//                 <span className="xs:hidden">Cart</span>
//               </button>
//               <button
//                 onClick={() => onQuickView?.(product.id.toString())}
//                 className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg"
//               >
//                 <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </Link>
      
//       {/* Product Info Section */}
//       <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
//         {/* Brand & Wishlist */}
//         <div className="flex justify-between items-start">
//           <Link href={`/brand/${product.brand.toLowerCase()}`}>
//             <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium hover:text-amber-600 transition-colors">
//               {product.brand}
//             </span>
//           </Link>
//           <button 
//             onClick={() => {
//               setIsWishlisted(!isWishlisted);
//               onAddToWishlist?.(product.id.toString());
//             }}
//             className="text-gray-400 hover:text-red-500 transition-all duration-200 hover:scale-110 p-1 -mt-1 -mr-1"
//             aria-label="Add to wishlist"
//           >
//             <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
//           </button>
//         </div>

//         {/* Product Name */}
//         <Link href={`/product/${product.slug}`}>
//           <h3 className="font-medium text-gray-800 text-sm sm:text-base leading-tight hover:text-amber-600 transition-colors line-clamp-2">
//             {product.name}
//           </h3>
//         </Link>

//         {/* Stock Status */}
//         {isInStock && (
//           <div className={`inline-flex items-center gap-1 ${stockStatus.bg} px-1.5 py-0.5 rounded-full`}>
//             <StockIcon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${stockStatus.color}`} />
//             <span className={`text-[9px] sm:text-[10px] font-medium ${stockStatus.color}`}>
//               {stockStatus.text}
//             </span>
//           </div>
//         )}

//         {/* Ratings & Sold Count */}
//         <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 sm:pt-1">
//           {renderStars()}
//           <div className="flex items-center gap-1 text-[9px] sm:text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full">
//             <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
//             <span>{product.soldCount.toLocaleString()} sold</span>
//           </div>
//         </div>

//         {/* Price Section */}
//         <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 pt-1 sm:pt-2">
//           <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
//             {formatPrice(product.discountPrice)}
//           </span>
//           {hasDiscount && (
//             <>
//               <span className="text-[10px] sm:text-xs text-gray-400 line-through">
//                 {formatPrice(product.originalPrice)}
//               </span>
//               <span className="text-[9px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.5 sm:px-1.5 rounded-full">
//                 Save {discountPercentage}%
//               </span>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;



// 'use client';

// import { useState } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { Star, Package, Heart, Eye, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
// import { useProductDrawer } from '@/lib/product-drawer';

// interface Product {
//   id: string | number;
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
//   stock?: number;
//   freeShipping?: boolean;
//   warranty?: string;
//   emiAvailable?: boolean;
//   badges?: {
//     isBestSeller?: boolean;
//     isNewArrival?: boolean;
//     isLimitedStock?: boolean;
//     isPremium?: boolean;
//   };
// }

// interface ProductCardProps {
//   product: Product;
//   fullProductData?: any; // Pass the full product data from API
//   onAddToCart?: (productId: string) => void;
//   onAddToWishlist?: (productId: string) => void;
//   onQuickView?: (productId: string) => void;
// }

// const ProductCard = ({ 
//   product, 
//   fullProductData,
//   onAddToCart, 
//   onAddToWishlist,
//   onQuickView 
// }: ProductCardProps) => {
//   const [isHovered, setIsHovered] = useState(false);
//   const [isWishlisted, setIsWishlisted] = useState(false);
//   const [imageError, setImageError] = useState(false);
//   const { openDrawer } = useProductDrawer();

//   const discountPercentage = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
//   const hasDiscount = product.discountPrice < product.originalPrice;
//   const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 10;
//   const isInStock = product.isAvailable && (product.stock === undefined || product.stock > 0);

//   const formatPrice = (price: number) => {
//     const currency = price > 1000 ? 'BDT' : 'USD';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currency,
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(price);
//   };

//   const getStockStatus = () => {
//     if (!isInStock) {
//       return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
//     }
//     if (isLowStock) {
//       return { text: `Only ${product.stock} left`, color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
//     }
//     return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
//   };

//   const stockStatus = getStockStatus();
//   const StockIcon = stockStatus.icon;

//   const handleQuickView = () => {
//     if (fullProductData) {
//       openDrawer(fullProductData);
//     } else if (onQuickView) {
//       onQuickView(product.id.toString());
//     }
//   };

//   const renderStars = () => {
//     const fullStars = Math.floor(product.rating);
//     const hasHalfStar = product.rating % 1 >= 0.5;
    
//     return (
//       <div className="flex items-center gap-0.5">
//         {[...Array(5)].map((_, i) => (
//           <Star
//             key={i}
//             className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
//               i < fullStars 
//                 ? 'text-amber-500 fill-amber-500' 
//                 : i === fullStars && hasHalfStar
//                 ? 'text-amber-500 fill-amber-500 opacity-50'
//                 : 'text-gray-300'
//             }`}
//           />
//         ))}
//         <span className="text-[10px] sm:text-xs text-gray-600 ml-1">({product.reviewCount})</span>
//       </div>
//     );
//   };

//   return (
//     <div 
//       className="group relative bg-white rounded-[8px] hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200"
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {/* Image Section */}
//       <Link href={`/product/${product.slug}`} className="block relative overflow-hidden bg-gray-100">
//         <div className="relative aspect-square">
//           {product.imageUrl && !imageError ? (
//             <Image
//               src={product.imageUrl}
//               alt={product.name}
//               fill
//               sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
//               className="object-cover transition-transform duration-500 group-hover:scale-105"
//               onError={() => setImageError(true)}
//               priority={false}
//             />
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
//               <div className="text-center">
//                 <Package className="w-8 h-8 mx-auto mb-1 opacity-50" />
//                 <span className="text-xs">No Image</span>
//               </div>
//             </div>
//           )}
          
//           {/* Badges */}
//           <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
//             {product.badges?.isBestSeller && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-amber-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm">
//                 BESTSELLER
//               </span>
//             )}
//             {product.badges?.isNewArrival && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-blue-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm">
//                 NEW
//               </span>
//             )}
//             {isLowStock && product.badges?.isLimitedStock && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm animate-pulse">
//                 ⚡ LIMITED
//               </span>
//             )}
//             {product.badges?.isPremium && (
//               <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] sm:text-[10px] font-bold rounded shadow-sm">
//                 PREMIUM
//               </span>
//             )}
//           </div>
          
//           {/* Discount Badge */}
//           {hasDiscount && (
//             <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
//               <div className="bg-red-500 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex flex-col items-center justify-center shadow-lg">
//                 <span className="text-white font-bold text-xs sm:text-sm">{discountPercentage}%</span>
//                 <span className="text-white text-[6px] sm:text-[8px] -mt-0.5">OFF</span>
//               </div>
//             </div>
//           )}
          
//           {/* Out of Stock Overlay */}
//           {!isInStock && (
//             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
//               <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 text-gray-800 font-semibold rounded-full text-xs sm:text-sm shadow-lg">
//                 Out of Stock
//               </span>
//             </div>
//           )}
          
//           {/* Quick Action Buttons */}
//           <div className={`absolute inset-x-0 bottom-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent transform transition-all duration-300 z-10 ${
//             isHovered && isInStock ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
//           }`}>
//             <div className="flex gap-1.5 sm:gap-2">
//               <button
//                 onClick={() => onAddToCart?.(product.id.toString())}
//                 disabled={!isInStock}
//                 className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg text-xs sm:text-sm"
//               >
//                 <Package className="w-3 h-3 sm:w-4 sm:h-4" />
//                 <span className="hidden xs:inline">Add to Cart</span>
//                 <span className="xs:hidden">Cart</span>
//               </button>
//               <button
//                 onClick={handleQuickView}
//                 className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg"
//               >
//                 <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </Link>
      
//       {/* Product Info Section */}
//       <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
//         {/* Brand & Wishlist */}
//         <div className="flex justify-between items-start">
//           <Link href={`/brand/${product.brand.toLowerCase()}`}>
//             <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium hover:text-amber-600 transition-colors">
//               {product.brand}
//             </span>
//           </Link>
//           <button 
//             onClick={() => {
//               setIsWishlisted(!isWishlisted);
//               onAddToWishlist?.(product.id.toString());
//             }}
//             className="text-gray-400 hover:text-red-500 transition-all duration-200 hover:scale-110 p-1 -mt-1 -mr-1"
//             aria-label="Add to wishlist"
//           >
//             <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
//           </button>
//         </div>

//         {/* Product Name */}
//         <Link href={`/product/${product.slug}`}>
//           <h3 className="font-medium text-gray-800 text-sm sm:text-base leading-tight hover:text-amber-600 transition-colors line-clamp-2">
//             {product.name}
//           </h3>
//         </Link>

//         {/* Stock Status */}
//         {isInStock && (
//           <div className={`inline-flex items-center gap-1 ${stockStatus.bg} px-1.5 py-0.5 rounded-full`}>
//             <StockIcon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${stockStatus.color}`} />
//             <span className={`text-[9px] sm:text-[10px] font-medium ${stockStatus.color}`}>
//               {stockStatus.text}
//             </span>
//           </div>
//         )}

//         {/* Ratings & Sold Count */}
//         <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 sm:pt-1">
//           {renderStars()}
//           <div className="flex items-center gap-1 text-[9px] sm:text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full">
//             <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
//             <span>{product.soldCount.toLocaleString()} sold</span>
//           </div>
//         </div>

//         {/* Price Section */}
//         <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 pt-1 sm:pt-2">
//           <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
//             {formatPrice(product.discountPrice)}
//           </span>
//           {hasDiscount && (
//             <>
//               <span className="text-[10px] sm:text-xs text-gray-400 line-through">
//                 {formatPrice(product.originalPrice)}
//               </span>
//               <span className="text-[9px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.5 sm:px-1.5 rounded-full">
//                 Save {discountPercentage}%
//               </span>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;




'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Heart, Eye, TrendingUp, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import { ProductDrawer } from './ProductDrawer';

interface ProductCardProps {
  product: {
    _id: string;
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
    fullProductData?: any;
  };
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
  onQuickView: (productId: string) => void;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const discountPercentage = Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100);
  const hasDiscount = product.discountPrice < product.originalPrice;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 10;
  const isInStock = product.isAvailable && (product.stock === undefined || product.stock > 0);

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
    // Don't open drawer if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setDrawerOpen(true);
  };

  return (
    <>
      <div 
        className="group relative bg-white rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
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
              {product.badges?.isBestSeller && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded shadow-sm">
                  BESTSELLER
                </span>
              )}
              {product.badges?.isPremium && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded shadow-sm">
                  PREMIUM
                </span>
              )}
            </div>
            
            {/* Discount Badge */}
            {hasDiscount && (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm"
                >
                  <ShoppingBag size={16} />
                  Buy Now
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWishlisted(!isWishlisted);
                  }}
                  className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-200 shadow-lg"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp size={12} className="text-green-500" />
              <span>{product.soldCount?.toLocaleString()} sold</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.floor(product.rating || 0) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
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
            <span className="text-lg font-bold text-gray-900">
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
      <ProductDrawer
        product={product}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};

export default ProductCard;