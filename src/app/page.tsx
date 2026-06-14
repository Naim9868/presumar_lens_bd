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
import { getProducts } from '@/app/actions/product/getProducts';
import  Hero  from '@/components/Hero/Hero';
import CategoryServer from '@/components/category/CategoryPage';
// import NewArrivals from "@/components/Home/NewArrival/NewArrivals";
// import BestSelling from "@/components/Home/BestSelling/BestSelling";
import Header from '@/components/Header';

export default async function Home() {
   const result = await getProducts({});
  
  // Ensure we have valid products array
   const products = result?.products ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Main banner */}
      {/* <HeroSection /> */}
      <Header />
      <Hero />
      <CategoryServer />

      {/* <NewArrivals /> */}
      {/* <BestSelling /> */}
      <ProductGrid initialProducts={products} />
      
      {/* Brand Showcase - Trust signals */}
      {/* <BrandShowcase /> */}
      
      {/* Categories - Product navigation */}
      {/* <CategoryGrid /> */}
      
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