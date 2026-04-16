// app/components/PromoBanner.tsx
'use client';

import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

const PromoBanner = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative p-8 md:p-12 text-center text-white">
            <Gift className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Limited Time Offer
            </h2>
            <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto">
              Get 20% off on all premium lenses + Free shipping on orders over $50
            </p>
            <Link 
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-amber-600 font-semibold rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              Shop Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;