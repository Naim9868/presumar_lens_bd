// app/admin/components/VariantImageUploader.tsx
'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface VariantImageUploaderProps {
  images: string[];
  onUpload: (images: string[]) => void;
  variantSku: string;
  maxImages?: number;
}

export default function VariantImageUploader({ 
  images, 
  onUpload, 
  variantSku, 
  maxImages = 5 
}: VariantImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > maxImages) {
      setUploadError(`Maximum ${maxImages} images allowed per variant`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', `products/variants/${variantSku}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      onUpload([...images, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    const publicId = extractPublicIdFromUrl(imageUrl);
    
    if (publicId) {
      setDeleting(imageUrl);
      try {
        const response = await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete from Cloudinary');
        }

        const newImages = images.filter((_, i) => i !== index);
        onUpload(newImages);
      } catch (error) {
        console.error('Delete error:', error);
        setUploadError('Failed to delete image');
      } finally {
        setDeleting(null);
      }
    } else {
      const newImages = images.filter((_, i) => i !== index);
      onUpload(newImages);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <div className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
              <Image
                src={img}
                alt={`Variant ${idx + 1}`}
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => removeImage(idx)}
              disabled={deleting === img}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
            >
              {deleting === img ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="relative h-20 w-20 rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer flex items-center justify-center transition-colors bg-gray-50 hover:bg-gray-100">
            {uploading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 text-gray-400" />
            )}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      
      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}
      
      <p className="text-xs text-gray-500">
        {images.length}/{maxImages} images - Supports JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}