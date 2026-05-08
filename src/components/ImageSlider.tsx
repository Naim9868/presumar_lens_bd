// components/ImageSlider.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  features?: string[];
  autoPlay?: boolean;
  interval?: number;
}

export default function ImageSlider({ 
  images, 
  features = [], 
  autoPlay = false, 
  interval = 5000 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <p className="text-gray-400">No image available</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        <Image
          src={images[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-white w-3' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Features Banner */}
      {features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {features.map((feature, idx) => (
            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}