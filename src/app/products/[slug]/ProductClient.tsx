// app/products/[slug]/ProductClient.tsx
'use client';

import { useEffect } from 'react';
import { IProduct } from '@/types/product';
import { ProductDrawer } from '@/components/product/ProductDrawer';
import { useProductDrawer } from '@/hooks/useProductDrawer';

interface ProductClientProps {
  product: IProduct;
}

export function ProductClient({ product }: ProductClientProps) {
  // This renders the full product page for SEO
  // The drawer can still be used for quick views elsewhere
  const { openDrawer, closeDrawer, isOpen } = useProductDrawer();
  
  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenDrawer = params.get('drawer') === 'true';
    
    if (shouldOpenDrawer && !isOpen) {
      openDrawer(product);
    }
  }, [openDrawer, isOpen, product]);
  
  return (
    <div>
      {/* Full product page content */}
      <div className="container mx-auto px-4 py-8">
        <h1>{product.name}</h1>
        {/* ... full product details ... */}
      </div>
      
      {/* Drawer for quick views from other pages */}
      <ProductDrawer />
    </div>
  );
}