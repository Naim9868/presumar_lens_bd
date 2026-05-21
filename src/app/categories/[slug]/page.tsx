// app/category/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { fetchCategoryBySlug } from '@/app/actions/category.actions';
import { getProductsByCategory } from '@/app/actions/product.actions';
import CategoryClient from './CategoryClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }
  
  return {
    title: `${category.name} - ProsumerLensBD`,
    description: category.description || `Shop premium ${category.name} for mobile photography.`,
    openGraph: {
      title: `${category.name} | ProsumerLensBD`,
      description: category.description || `Shop premium ${category.name} for mobile photography`,
      images: category.image ? [{ url: category.image }] : [],
    },
  };
}

// This is the main page component - MUST be default export
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { sort = 'newest', page = '1' } = await searchParams;
  
  // Fetch category data
  const category = await fetchCategoryBySlug(slug);
  
  if (!category) {
    notFound();
  }
  
  // Fetch products for this category
  const result = await getProductsByCategory(
    category._id,
    parseInt(page),
    sort
  );

 
  
  // Pass data to client component
  return (
    <CategoryClient 
      category={category}
      initialProducts={result.products}
      initialTotal={result.total}
      initialTotalPages={result.totalPages}
      currentSort={sort}
      currentPage={parseInt(page)}
    />
  );
}