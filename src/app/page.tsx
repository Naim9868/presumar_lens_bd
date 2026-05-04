// app/page.tsx
import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanner from "@/components/PromoBanner";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
// import BrandShowcase from "@/components/BrandShowcase";
// import ProductGrid from "@/components/ProductGrid";
import { ProductGrid } from '@/components/product/ProductGrid';
import { getAllProducts } from '@/app/actions/product.actions';

export default async function Home() {
   const result = await getAllProducts();
  
  // Ensure we have valid products array
  const products = result.success && result.products ? result.products : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Main banner */}
      <HeroSection />

        <ProductGrid initialProducts={products} />
      
      {/* Brand Showcase - Trust signals */}
      {/* <BrandShowcase /> */}
      
      {/* Categories - Product navigation */}
      <CategoryGrid />
      
      {/* Featured Products - Best sellers */}
      <FeaturedProducts />
      
      {/* Promotional Banner - Special offers */}
      <PromoBanner />
      
      {/* Testimonials - Social proof */}
      <Testimonials />
      
      {/* Newsletter - Email collection */}
      <Newsletter />
    </div>
  );
}