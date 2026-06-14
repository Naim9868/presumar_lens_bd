// src/components/admin/ImageUpload.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onUpload: (url: string, publicId?: string) => void;
  onRemove?: () => void;
  defaultValue?: string;
  defaultPublicId?: string;
  folder?: string;
}

export default function ImageUpload({ 
  onUpload, 
  onRemove, 
  defaultValue, 
  defaultPublicId,
  folder = 'drc' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(defaultValue);
  const [currentPublicId, setCurrentPublicId] = useState(defaultPublicId);

  useEffect(() => {
    setPreview(defaultValue);
    setCurrentPublicId(defaultPublicId);
  }, [defaultValue, defaultPublicId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    // If there's an existing image, send its publicId to be deleted
    // if (currentPublicId) {
    //   formData.append('oldPublicId', currentPublicId);
    // }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setCurrentPublicId(data.publicId);
        onUpload(data.url, data.publicId);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Upload failed');
        setPreview(defaultValue);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setPreview(defaultValue);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (currentPublicId) {
      try {
        const res = await fetch(`/api/upload?publicId=${currentPublicId}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          toast.success('Image removed successfully');
        } else {
          toast.error('Failed to remove image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Failed to remove image');
      }
    }
    
    setPreview(undefined);
    setCurrentPublicId(undefined);
    
    if (onRemove) {
      onRemove();
    } else {
      onUpload('', '');
    }
  };

  return (
    <div className="space-y-3">
      {preview && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          {(onRemove || currentPublicId) && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      
      <label className="relative cursor-pointer inline-block">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />
        <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-all flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
        </div>
      </label>
      
      {uploading && (
        <div className="text-xs text-gray-500">Uploading to Cloudinary...</div>
      )}
    </div>
  );
}