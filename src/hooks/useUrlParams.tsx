'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProductDrawer } from '@/hooks/useProductDrawer';
import { ProductDrawer } from '@/components/product/ProductDrawer';

// components/ProductDrawerHandler.tsx

export function ProductDrawerHandler() {
  const { openDrawer, closeDrawer, isOpen } = useProductDrawer();

  // Handle URL params on client side only
  useEffect(() => {
    const handleUrlParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get('product');
      const shouldOpen = params.get('drawer') === 'true';
      
      if (productSlug && shouldOpen && !isOpen) {
        try {
          const response = await fetch(`/api/products/slug/${productSlug}`);
          if (response.ok) {
            const product = await response.json();
            openDrawer(product);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
    };

    handleUrlParams();

    // Handle browser back/forward buttons
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get('product');
      
      if (!productSlug) {
        closeDrawer();
      } else {
        handleUrlParams();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [openDrawer, closeDrawer, isOpen]);

  return <ProductDrawer />;
}
// Hook to handle URL params on page load
// export const useProductDrawerFromURL = () => {
//   const router = useRouter();
//   const { openDrawer } = useProductDrawer();
  
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const productSlug = params.get('product');
    
//     if (productSlug) {
//       // Fetch product by slug and open drawer
//       fetch(`/api/products/slug/${productSlug}`)
//         .then(res => res.json())
//         .then(product => {
//           if (product) openDrawer(product);
//         })
//         .catch(console.error);
//     }
//   }, [openDrawer]);
  
//   // Handle browser back/forward buttons
//   useEffect(() => {
//     const handlePopState = () => {
//       const params = new URLSearchParams(window.location.search);
//       const productSlug = params.get('product');
      
//       if (!productSlug) {
//         // Close drawer if no product in URL
//         const { closeDrawer } = useProductDrawer.getState();
//         closeDrawer();
//       }
//     };
    
//     window.addEventListener('popstate', handlePopState);
//     return () => window.removeEventListener('popstate', handlePopState);
//   }, []);
// };

// Client-side only hook for handling URL params
// export const useProductDrawerFromURL = () => {
//   const { openDrawer, closeDrawer } = useProductDrawer();
  
//   // This effect only runs on client-side
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const productSlug = params.get('product');
//     const shouldOpen = params.get('drawer') === 'true';
    
//     if (productSlug && shouldOpen) {
//       // Fetch product by slug and open drawer
//       fetch(`/api/products/slug/${productSlug}`)
//         .then(res => res.json())
//         .then(product => {
//           if (product) openDrawer(product);
//         })
//         .catch(console.error);
//     }
    
//     // Handle browser back/forward buttons
//     const handlePopState = () => {
//       const newParams = new URLSearchParams(window.location.search);
//       const newProductSlug = newParams.get('product');
      
//       if (!newProductSlug) {
//         closeDrawer();
//       }
//     };
    
//     window.addEventListener('popstate', handlePopState);
//     return () => window.removeEventListener('popstate', handlePopState);
//   }, [openDrawer, closeDrawer]);
// };


// // Separate component for drawer handler
// export function ProductDrawerHandler() {
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