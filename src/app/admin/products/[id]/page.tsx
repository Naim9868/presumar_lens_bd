// app/admin/products/[id]/page.tsx
import { getProductById } from '@/app/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  let product;
  
  try {
    const result = await getProductById(id);
    
    if (!result.success || !result.product) {
      notFound();
    }
    
    product = result.product;
    
  } catch (error) {
    console.error('Error fetching product:', error);
    notFound();
  }
  
  // Return JSX outside of try/catch
  return <ProductDetailClient initialProduct={product} productId={id} />;
}