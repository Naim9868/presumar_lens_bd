// app/components/HeroSection.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Truck, RefreshCw } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full text-amber-700 text-sm font-medium mx-auto lg:mx-0">
              <Shield className="w-4 h-4" />
              Premium Quality Since 2024
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              See the World in
              <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent"> Premium Clarity</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">
              Discover our exclusive collection of premium lenses and eyewear. 
              Engineered for perfection, designed for elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/shop" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-full hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/collections" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-full border border-gray-300 hover:border-amber-500 hover:text-amber-600 transition-all duration-200"
              >
                View Collections
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Truck className="w-5 h-5 text-amber-600" />
                <span className="text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <span className="text-sm">30-Day Returns</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-5 h-5 text-amber-600" />
                <span className="text-sm">2-Year Warranty</span>
              </div>
            </div>
          </div>
          
          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent"></div>
              <Image 
                src="/hero-glasses.jpg" 
                alt="Premium Eyewear"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 animate-bounce">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">50%</div>
                <div className="text-xs text-gray-600">OFF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-300 rounded-full blur-3xl opacity-20"></div>
      </div>
    </section>
  );
};

export default HeroSection;