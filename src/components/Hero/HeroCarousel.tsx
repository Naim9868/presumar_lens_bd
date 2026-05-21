// HeroCarousel.tsx
"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import Image from "next/image";
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const HeroCarousel = () => {
  const slides = [
    {
      id: 1,
      badge: "NEW ARRIVAL",
      headline: "Apexel 200X Telephoto Lens",
      description: "Professional telephoto lens with 200X zoom for smartphone",
      cta: "Shop Now",
      bgImage: "https://media.istockphoto.com/id/861054652/photo/disassembled-smartphone-camera-visual-concept.webp?a=1&b=1&s=612x612&w=0&k=20&c=4YB_-SckwhN02thOaIxMjLy87ekKQpVuBIpgyHqm3Pw=",
    },
    {
      id: 2,
      badge: "CINEMATIC",
      headline: "Cinematic Mobile Lens Kit",
      description: "Complete filmmaking setup with anamorphic & macro lenses",
      cta: "Shop Now",
      bgImage: "https://images.unsplash.com/photo-1504992963429-56f2d62fbff0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGxlbnN8ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 3,
      badge: "PRO BUNDLE",
      headline: "Mobile Creator Pro Bundle",
      description: "Save 30% on gimbal, tripod & lens kit",
      cta: "Shop Now",
      bgImage: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGVuc3xlbnwwfHwwfHx8MA%3D%3D",
    },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden h-[420px] md:h-[500px] lg:h-[560px] group">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: false,
        }}
        navigation={{
          nextEl: ".custom-swiper-button-next",
          prevEl: ".custom-swiper-button-prev",
        }}
        loop={true}
        speed={1000}
        className="h-full"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full w-full">
              {/* Background Image */}
              <Image
                src={slide.bgImage}
                alt={slide.headline}
                fill
                priority={idx === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 70vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                style={{ objectPosition: 'center' }}
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="max-w-xl px-6 md:px-10 lg:px-12">
                  <div className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 animate-fade-in-up">
                    {slide.badge}
                  </div>
                  
                  <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 animate-fade-in-up animation-delay-100">
                    {slide.headline}
                  </h2>
                  
                  <p className="text-gray-200 text-base md:text-lg max-w-md mb-8 animate-fade-in-up animation-delay-200">
                    {slide.description}
                  </p>
                  
                  <button className="group bg-white text-gray-900 hover:bg-amber-400 hover:text-gray-900 font-semibold py-3 px-8 rounded-full transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl animate-fade-in-up animation-delay-300">
                    <ShoppingBag className="w-4 h-4" />
                    {slide.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Styled Navigation Buttons */}
      <button className="custom-swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg border border-white/20">
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button className="custom-swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg border border-white/20">
        <ChevronRight className="w-5 h-5" />
      </button>
      
      <style jsx global>{`
        .swiper-pagination {
          bottom: 24px !important;
          text-align: left !important;
          left: 24px !important;
          width: auto !important;
          z-index: 20 !important;
        }
        
        .swiper-pagination-bullet {
          transition: all 0.3s ease !important;
          width: 8px !important;
          height: 8px !important;
          background: white !important;
          opacity: 0.5 !important;
          margin: 0 6px !important;
          display: inline-block !important;
          border-radius: 50% !important;
          cursor: pointer !important;
        }
        
        .swiper-pagination-bullet-active {
          width: 24px !important;
          border-radius: 4px !important;
          opacity: 1 !important;
          background: #f59e0b !important;
        }
        
        .swiper-pagination-bullet:hover {
          opacity: 0.8 !important;
          background: #f59e0b !important;
        }
        
        /* Hide default Swiper navigation arrows */
        .swiper-button-prev,
        .swiper-button-next {
          display: none !important;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        
        @media (max-width: 768px) {
          .swiper-pagination {
            bottom: 16px !important;
            left: 16px !important;
          }
          
          .swiper-pagination-bullet {
            width: 6px !important;
            height: 6px !important;
            margin: 0 4px !important;
          }
          
          .swiper-pagination-bullet-active {
            width: 20px !important;
          }
          
          /* Hide arrows on mobile for better touch experience */
          .custom-swiper-button-prev,
          .custom-swiper-button-next {
            display: none !important;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .custom-swiper-button-prev,
          .custom-swiper-button-next {
            width: 10px !important;
            height: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;