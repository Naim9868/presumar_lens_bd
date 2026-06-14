// src/app/products/page.tsx
import { Suspense } from 'react';
import { getProducts } from '@/app/actions/product/getProducts';
import { getCategories } from '@/app/actions/category/getCategories';
import { getBrands } from '@/app/actions/brand/getBrands';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ProductsClient from './ProductsClient';

interface SearchParams {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  search?: string;
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  
  // Get filter parameters
  const categoryId = params.category;
  const brandId = params.brand;
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined;
  const sort = params.sort || 'newest';
  const page = parseInt(params.page || '1');
  const search = params.search;

  // Fetch all data in parallel
  const [productsResult, categories, brands] = await Promise.all([
    getProducts({
      page,
      limit: 12,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      sort,
      query: search,
      status: 'active',
    }),
    getCategories({ status: 'active' }),
    getBrands({ isActive: true }),
  ]);

  const products = productsResult?.products || [];
  const pagination = productsResult?.pagination || { 
    page: 1, 
    limit: 12, 
    total: 0, 
    totalPages: 0 
  };

  // Pass initial data to client component
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop Our Products</h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Discover premium quality products at competitive prices. Shop with confidence and enjoy free shipping on orders over $50.
          </p>
        </div>
      </div>

      <ProductsClient 
        initialProducts={products}
        initialPagination={pagination}
        categories={categories}
        brands={brands}
        initialFilters={{
          categoryId,
          brandId,
          minPrice: minPrice?.toString(),
          maxPrice: maxPrice?.toString(),
          sort,
          search,
        }}
      />

      <Footer />
    </div>
  );
}