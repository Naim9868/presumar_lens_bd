// // components/products/BestSellingClient.tsx
// "use client";

// import { useState, useRef, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, TrendingUp, Star } from 'lucide-react';
// import ProductCard from '@/components/product/ProductCard';
// import { IProduct } from '@/types/product';
// import Link from 'next/link';

// interface BestSellingClientProps {
//   products: IProduct[];
//   title: string;
//   subtitle: string;
// }

// export default function BestSellingClient({ products, title, subtitle }: BestSellingClientProps) {
//   const [scrollPosition, setScrollPosition] = useState(0);
//   const [maxScroll, setMaxScroll] = useState(0);
//   const scrollContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const updateScrollMetrics = () => {
//       if (scrollContainerRef.current) {
//         const container = scrollContainerRef.current;
//         const maxScrollable = container.scrollWidth - container.clientWidth;
//         setMaxScroll(maxScrollable);
//         setScrollPosition(container.scrollLeft);
//       }
//     };

//     updateScrollMetrics();
//     window.addEventListener('resize', updateScrollMetrics);
    
//     return () => window.removeEventListener('resize', updateScrollMetrics);
//   }, [products]);

//   const handleScroll = () => {
//     if (scrollContainerRef.current) {
//       setScrollPosition(scrollContainerRef.current.scrollLeft);
//     }
//   };

//   const scroll = (direction: 'left' | 'right') => {
//     if (scrollContainerRef.current) {
//       const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
//       const newPosition = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
//       scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
//     }
//   };

//   // Sort products by rating for display (highest first)
//   const sortedProducts = [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

//   if (!products || products.length === 0) {
//     return null;
//   }

//   return (
//     <section className="py-16 bg-white dark:bg-slate-900">
//       <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
//         {/* Section Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
//           <div>
//             <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
//               <TrendingUp className="w-4 h-4" />
//               Top Rated
//             </div>
//             <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
//               {title}
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
//               {subtitle}
//             </p>
//           </div>
          
//           {/* Navigation Arrows */}
//           {products.length > 4 && (
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => scroll('left')}
//                 disabled={scrollPosition <= 0}
//                 className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
//                 aria-label="Previous products"
//               >
//                 <ChevronLeft className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => scroll('right')}
//                 disabled={scrollPosition >= maxScroll - 10}
//                 className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
//                 aria-label="Next products"
//               >
//                 <ChevronRight className="w-5 h-5" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Products Carousel */}
//         <div
//           ref={scrollContainerRef}
//           onScroll={handleScroll}
//           className="overflow-x-auto scrollbar-hide scroll-smooth"
//           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
//         >
//           <div className="flex gap-4 md:gap-6 pb-4 min-w-max">
//             {sortedProducts.map((product, index) => (
//               <div key={product._id} className="w-[280px] sm:w-[300px] md:w-[320px] flex-shrink-0">
//                 <div className="relative">
//                   {/* Rating Badge */}
//                   {product.averageRating && product.averageRating >= 4.5 && (
//                     <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
//                       <Star className="w-3 h-3 fill-white" />
//                       {product.averageRating.toFixed(1)}
//                     </div>
//                   )}
//                   {/* Best Seller Badge */}
//                   {index < 3 && (
//                     <div className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
//                       <TrendingUp className="w-3 h-3" />
//                       #{index + 1} Best Seller
//                     </div>
//                   )}
//                   <ProductCard product={product} priority={index < 4} />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* View All Link */}
//         <div className="text-center mt-8">
//           <Link
//             href="/products?sort=popular"
//             className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold group"
//           >
//             View All Best Sellers
//             <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//           </Link>
//         </div>
//       </div>

//       <style jsx global>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//       `}</style>
//     </section>
//   );
// }