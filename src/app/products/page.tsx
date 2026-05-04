import { ProductGrid } from '@/components/product/ProductGrid';
import { getAllProducts } from '@/app/actions/product.actions';

export const metadata = {
  title: 'All Products - Premium Collection',
  description: 'Browse our complete collection of premium products',
};

export default async function ProductsPage() {
  const { products, success } = await getAllProducts();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Products</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Browse our complete collection
        </p>
      </div>
      
      <ProductGrid initialProducts={success ? products : []} />
    </div>
  );
}