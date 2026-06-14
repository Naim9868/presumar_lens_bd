// app/category/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getCategoryBySlug } from '@/app/actions/category/getCategories';
import { getProductsByCategory } from '@/app/actions/product/getProductsByCategory';
import CategoryClient from './CategoryClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
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

// Map sort values from URL to API expected values
function mapSortToApiParam(sort: string): 'newest' | 'price_low' | 'price_high' | 'popular' | 'featured' {
  switch (sort) {
    case 'price_asc':
      return 'price_low';
    case 'price_desc':
      return 'price_high';
    case 'rating':
      return 'popular';
    case 'newest':
      return 'newest';
    case 'popular':
      return 'popular';
    case 'featured':
      return 'featured';
    default:
      return 'newest';
  }
}

// Map sort values from API to URL
function mapApiSortToUrl(sort: string): string {
  switch (sort) {
    case 'price_low':
      return 'price_asc';
    case 'price_high':
      return 'price_desc';
    default:
      return sort;
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { sort = 'newest', page = '1' } = await searchParams;
  
  // Fetch category data
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    notFound();
  }
  
  const currentPage = parseInt(page);
  const currentSort = mapSortToApiParam(sort);
  
  // Fetch products for this category using the correct API
  const result = await getProductsByCategory({
    categoryId: category._id,
    sort: currentSort,
    page: currentPage,
    limit: 20,
    status: 'active',
    inStock: true,
  });
  
  // Pass data to client component
  return (
    <CategoryClient 
      category={category}
      initialProducts={result.products}
      initialTotal={result.pagination.total}
      initialTotalPages={result.pagination.totalPages}
      currentSort={sort}
      currentPage={currentPage}
    />
  );
}