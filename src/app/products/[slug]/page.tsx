// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductBySlug } from '@/app/actions/product/getProductBySlug';
import { getRelatedProducts } from '@/app/actions/product/getRelatedProducts';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ProductDetailsClient from './ProductDetailsClient';

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  
  if (!result.success || !result.product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }
  
  const product = result.product;
  
  return {
    title: `${product.name} - ProsumerLensBD`,
    description: product.shortDescription || product.description?.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description?.substring(0, 160),
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
    },
  };
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.product) {
    notFound();
  }

  const product = result.product;
  
  // The product from getProductBySlug already has populated brand and category
  // So we don't need to fetch them again
  const enrichedProduct = {
    ...product,
    // Ensure brand and category are in the expected format
    brand: product.brand ? {
      _id: product.brand._id?.toString() || '',
      name: product.brand.name || '',
      slug: product.brand.slug || '',
    } : null,
    category: product.category ? {
      _id: product.category._id?.toString() || '',
      name: product.category.name || '',
      slug: product.category.slug || '',
    } : null,
  };
  
  // Safely get category ID for related products
  const categoryId = enrichedProduct.category?._id;
  
  // Fetch related products if category exists
  let relatedProducts: any[] = [];
  if (categoryId) {
    const relatedResult = await getRelatedProducts({
      categoryId,
      excludeId: product._id,
      limit: 4,
    });
    if (relatedResult.success) {
      relatedProducts = relatedResult.products;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProductDetailsClient 
        product={enrichedProduct}
        relatedProducts={relatedProducts}
      />
      <Footer />
    </div>
  );
}