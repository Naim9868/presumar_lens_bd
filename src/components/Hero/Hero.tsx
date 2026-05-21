// Hero.tsx
"use client";

import React from "react";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import Image from "next/image";
import { Zap, ArrowRight, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-12 md:pb-16 bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        {/* Main Grid: Carousel (70%) + Side Cards (30%) */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: Hero Carousel - 70% width */}
          <div className="lg:w-[70%]">
            <HeroCarousel />
          </div>

          {/* Right: Promotional Side Cards - 30% width */}
          <div className="lg:w-[30%] flex flex-row lg:flex-col gap-5">
            {/* Card 1: Macro Lens Pro */}
            <div className="flex-1 group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[220px] cursor-pointer">
              {/* Background Image */}
              <Image
                src="https://www.shopapexel.com/cdn/shop/files/10_ba574114-41f0-4853-a57b-f986f66bfc3b.jpg?v=1761307723&width=1200"
                alt="Macro Lens Pro"
                fill
                sizes="(max-width: 1024px) 50vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              
              {/* Gradient Overlay - Matching Hero Carousel style */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-5">
                {/* Discount Badge - Top Right */}
                <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-10">
                  -35% OFF
                </div>
                
                {/* Title and Description - Bottom Left */}
                <div className="absolute bottom-16 left-5 pr-16">
                  <h3 className="text-white text-xl font-bold mb-1">Macro Lens Pro</h3>
                  <p className="text-gray-200 text-xs">15x magnification • Ultra HD</p>
                </div>
                
                {/* Price and Button - Bottom */}
                <div className="flex items-center justify-between mt-auto">
                  <button className="text-sm font-semibold text-white hover:text-amber-400 transition-colors flex items-center gap-1 group/btn py-1.5">
                    Shop Now
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-2xl font-bold">$89</span>
                    <span className="text-gray-600 line-through text-sm">$139</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Mobile Vlogging Kit */}
            <div className="flex-1 group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[220px] cursor-pointer">
              {/* Background Image */}
              <Image
                src="https://www.shopapexel.com/cdn/shop/files/TM10_2_1500x1500_ccf0229d-ee33-48e3-9c01-df7e38b34466.webp?v=1776065700&width=1080"
                alt="Vlogging Kit"
                fill
                sizes="(max-width: 1024px) 50vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Gradient Overlay - Matching Hero Carousel style */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-5">
                {/* Limited Badge - Top Right */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                  <Zap className="w-3 h-3 fill-white" />
                  Limited Time
                </div>
                
                {/* Title and Description - Bottom Left */}
                <div className="absolute bottom-16 left-5 pr-20">
                  <h3 className="text-white text-xl font-bold mb-1">Mobile Vlogging Kit</h3>
                  <p className="text-gray-200 text-xs">Complete creator setup • 4K Ready</p>
                </div>
                
                {/* Price and Button - Bottom */}
                <div className="flex items-center justify-between mt-auto">
                  <button className="text-sm font-semibold text-white hover:text-amber-400 transition-colors flex items-center gap-1 group/btn  py-1.5">
                    Shop Bundle
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-2xl font-bold">$149</span>
                    <span className="text-gray-600 line-through text-sm">$199</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section Below */}
        <div className="mt-10">
          <HeroFeature />
        </div>
      </div>
    </section>
  );
};

export default Hero;