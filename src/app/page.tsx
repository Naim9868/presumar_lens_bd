// app/page.tsx
import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanner from "@/components/PromoBanner";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import BrandShowcase from "@/components/BrandShowcase";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Main banner */}
      <HeroSection />

      <ProductGrid />
      
      {/* Brand Showcase - Trust signals */}
      <BrandShowcase />
      
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