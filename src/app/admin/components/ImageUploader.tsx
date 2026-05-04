// app/admin/components/ImageUploader.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon, Star } from 'lucide-react';
import NextImage from 'next/image';

interface ImageUploaderProps {
  images: string[];
  onUpload?: (images: string[]) => void;
  onChange?: (images: string[]) => void;
  onThumbnailChange?: (thumbnailUrl: string) => void;
  maxImages?: number;
  thumbnail?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export default function ImageUploader({ 
  images, 
  onChange, 
  onUpload, 
  onThumbnailChange,
  maxImages = 10,
  thumbnail
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = onChange || onUpload;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === 'error') {
      alert(message);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    if (file.size < 500 * 1024) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          let quality = 0.8;
          if (file.size > 5 * 1024 * 1024) quality = 0.6;
          else if (file.size > 2 * 1024 * 1024) quality = 0.7;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '.jpg'),
                  { type: 'image/jpeg' }
                );
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadSingleImage = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
      
      xhr.open('POST', '/api/upload');
      xhr.timeout = 120000;
      xhr.send(formData);
    });
  };

  const uploadImages = async (files: File[]) => {
    if (!handleImageChange) {
      console.error('No onChange or onUpload handler provided');
      return;
    }

    if (images.length + files.length > maxImages) {
      showToast(`Maximum ${maxImages} images allowed`, 'error');
      return;
    }

    setUploading(true);
    const progressList: UploadProgress[] = [];
    
    try {
      const uploadPromises = files.map(async (file) => {
        const progressItem: UploadProgress = {
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        };
        progressList.push(progressItem);
        setUploadProgress([...progressList]);

        try {
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name} is not an image file`);
          }

          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`${file.name} exceeds 10MB limit`);
          }

          let fileToUpload = file;
          if (file.size > 1 * 1024 * 1024) {
            try {
              fileToUpload = await compressImage(file);
            } catch (error) {
              console.warn('Compression failed, using original:', error);
            }
          }

          const maxRetries = 2;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const url = await uploadSingleImage(fileToUpload, (progress) => {
                progressItem.progress = progress;
                setUploadProgress([...progressList]);
              });
              
              progressItem.status = 'success';
              setUploadProgress([...progressList]);
              return url;
            } catch (error) {
              console.error(`Attempt ${attempt} failed for ${file.name}:`, error);
              if (attempt === maxRetries) {
                progressItem.status = 'error';
                setUploadProgress([...progressList]);
                throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }
          return null;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          progressItem.status = 'error';
          setUploadProgress([...progressList]);
          return null;
        }
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);
      
      if (uploadedUrls.length > 0) {
        const newImages = [...images, ...uploadedUrls];
        handleImageChange(newImages);
        
        // Auto-select first uploaded image as thumbnail if no thumbnail exists
        if (!thumbnail && uploadedUrls.length > 0 && onThumbnailChange) {
          onThumbnailChange(uploadedUrls[0]);
        }
        
        showToast(`${uploadedUrls.length} image(s) uploaded successfully`);
      }
      
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload images. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadImages(files);
  }, [images, maxImages, thumbnail]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadImages(files);
  }, [images, maxImages, thumbnail]);

  const handleUrlAdd = () => {
    if (!handleImageChange) return;
    
    if (!urlInput.trim()) return;
    
    if (images.length >= maxImages) {
      showToast(`Maximum ${maxImages} images allowed`, 'error');
      return;
    }

    try {
      new URL(urlInput);
      const newImages = [...images, urlInput];
      handleImageChange(newImages);
      
      // Auto-select first URL as thumbnail if no thumbnail exists
      if (!thumbnail && onThumbnailChange) {
        onThumbnailChange(urlInput);
      }
      
      setUrlInput('');
      setShowUrlInput(false);
      showToast('Image URL added');
    } catch {
      showToast('Please enter a valid URL', 'error');
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
    if (!handleImageChange) return;
    
    const imageUrl = images[index];
    const isThumbnail = thumbnail === imageUrl;
    
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
        handleImageChange(newImages);
        setFailedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageUrl);
          return newSet;
        });
        
        // If thumbnail was deleted, set first remaining image as thumbnail
        if (isThumbnail && onThumbnailChange) {
          if (newImages.length > 0) {
            onThumbnailChange(newImages[0]);
          } else {
            onThumbnailChange('');
          }
        }
        
        showToast('Image deleted');
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete image', 'error');
      } finally {
        setDeleting(null);
      }
    } else {
      const newImages = images.filter((_, i) => i !== index);
      handleImageChange(newImages);
      
      // If thumbnail was removed, set first remaining image as thumbnail
      if (isThumbnail && onThumbnailChange) {
        if (newImages.length > 0) {
          onThumbnailChange(newImages[0]);
        } else {
          onThumbnailChange('');
        }
      }
      
      showToast('Image removed');
    }
  };

  const handleImageError = (imageUrl: string) => {
    if (!failedImages.has(imageUrl)) {
      setFailedImages(prev => new Set(prev).add(imageUrl));
    }
  };

  const setAsThumbnail = (index: number) => {
    if (onThumbnailChange) {
      onThumbnailChange(images[index]);
      showToast('Thumbnail updated');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Product Images
      </h3>
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-4">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              {!failedImages.has(image) ? (
                <div className="relative w-full h-full">
                  <NextImage
                    src={image}
                    alt={`Product ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={() => handleImageError(image)}
                    unoptimized={!image.includes('cloudinary.com')}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Failed to load</p>
                  </div>
                </div>
              )}
              
              {/* Thumbnail Badge */}
              {thumbnail === image && (
                <div className="absolute top-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white shadow-md flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Thumbnail
                </div>
              )}
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
                {thumbnail !== image && (
                  <button
                    type="button"
                    onClick={() => setAsThumbnail(index)}
                    className="rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Set as Thumbnail
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={deleting === image}
                  className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 transition disabled:opacity-50"
                >
                  {deleting === image ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </div>
              
              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
                {index + 1}/{images.length}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2 mb-4">
          {uploadProgress.map((item, idx) => (
            <div key={idx} className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-600 dark:text-amber-400 truncate flex-1">
                  {item.fileName}
                </span>
                <span className="text-amber-600 dark:text-amber-400 ml-2">
                  {item.status === 'uploading' ? `${Math.round(item.progress)}%` : 
                   item.status === 'success' ? '✓ Complete' : '✗ Failed'}
                </span>
              </div>
              {item.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative mb-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center
          rounded-lg border-2 border-dashed transition-all duration-200
          ${dragActive 
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-[1.01]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${(uploading || images.length >= maxImages) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading || images.length >= maxImages}
        />
        
        <div className="text-center p-6">
          {uploading ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-amber-500" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Uploading images...
              </p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Drag & drop images here, or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 5MB each (Max {maxImages} images)
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Click &quot;Set as Thumbnail&quot; on any image to make it the main product image
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Upload size={18} />
          )}
          {uploading ? 'Uploading...' : 'Upload from Computer'}
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={images.length >= maxImages}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <LinkIcon size={18} />
          Add from URL
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
          <ImageIcon size={18} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {images.length} / {maxImages} images
          </span>
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2 mt-4">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter image URL (https://...)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 shadow-md"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && uploadProgress.length === 0 && (
        <div className="text-center py-4 mt-2">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 opacity-50" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No images uploaded yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Upload product images to showcase your product
          </p>
        </div>
      )}
    </div>
  );
}