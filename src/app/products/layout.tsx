// app/products/layout.tsx
// 'use client';

import { ProductDrawer } from '@/components/product/ProductDrawer';
import { ProductDrawerHandler } from '@/hooks/useUrlParams';
// import { useEffect } from 'react';

// Separate component for drawer handler
// function ProductDrawerHandler() {
//   // Only run on client side
//   useEffect(() => {
//     // Import and use the hook only on client
//     const initDrawer = async () => {
//       const { useProductDrawerFromURL } = await import('@/hooks/useUrlParams');
//       // This will handle URL params
//       useProductDrawerFromURL();
//     };
    
//     initDrawer();
//   }, []);
  
//   return <ProductDrawer />;
// }

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ProductDrawerHandler />
    </>
  );
}