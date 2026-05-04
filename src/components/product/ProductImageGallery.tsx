'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, X } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const mainImage = images[selectedImage] || images[0] || '/placeholder-image.jpg';
  const thumbnails = images.slice(0, 6);
  
  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div 
          className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 cursor-pointer group"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image
            src={mainImage}
            alt={`${productName} - Image ${selectedImage + 1}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {/* Thumbnails */}
        {thumbnails.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {thumbnails.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                onMouseEnter={() => setSelectedImage(idx)}
                className={`
                  relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                  ${selectedImage === idx 
                    ? 'border-amber-500 shadow-lg' 
                    : 'border-transparent opacity-70 hover:opacity-100'
                  }
                `}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/90 z-[100] animate-in fade-in duration-300"
            onClick={() => setIsLightboxOpen(false)}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <div className="relative max-w-4xl w-full aspect-square">
              <Image
                src={mainImage}
                alt={productName}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
            
            {/* Lightbox Thumbnails */}
            {thumbnails.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {thumbnails.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`
                      relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                      ${selectedImage === idx 
                        ? 'border-amber-500' 
                        : 'border-white/30 hover:border-white/60'
                      }
                    `}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}