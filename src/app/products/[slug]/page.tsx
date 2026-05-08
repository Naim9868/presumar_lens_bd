// app/products/[slug]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductClient } from './ProductClient';
import { getProductBySlug, getAllProducts } from '@/app/actions/product.actions';
import { IProduct } from '@/types/product';

/* ================= METADATA ================= */

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  
  const slug = (await params).slug;
  const res = await getProductBySlug(slug);

  if (!res.success || !res.product) {
    return {
      title: 'Product Not Found'
    };
  }

  const product = res.product;

  const image =
    product.thumbnail ||
    product.images?.[0] ||
    '/placeholder.png';

  return {
    title: `${product.name} | Your Store`,
    description: product.shortDescription || product.description,

    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description,
      images: [image],
      type: 'website', // ✅ FIXED
    },

    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

/* ================= STATIC PARAMS ================= */

export async function generateStaticParams() {
  const res = await getAllProducts();

  if (!res.success) return [];

  return res.products.map((p: IProduct) => ({
    slug: p.slug
  }));
}

/* ================= PAGE ================= */

export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;
  const res = await getProductBySlug(slug);

  if (!res.success || !res.product) {
    notFound();
  }

  return <ProductClient product={res.product} />;
}