// lib/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // 120 seconds timeout
});

// Upload image using buffer (most efficient)
export async function uploadImageBuffer(
  buffer: Buffer,
  originalName: string,
  folder: string = 'products'
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          timeout: 120000,
          chunk_size: 6000000, // 6MB chunks for better performance
          transformation: [
            { quality: 'auto:good' }, // Auto quality optimization
            { fetch_format: 'auto' }, // Auto format (WebP, etc.)
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });
    
    return {
      url: (result as UploadApiResponse).secure_url,
      publicId: (result as UploadApiResponse).public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

// Upload image from base64 (fallback)
export async function uploadImageBase64(
  base64String: string,
  folder: string = 'products'
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'auto',
      timeout: 120000,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

// Delete image from Cloudinary
export async function deleteImage(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok') {
      throw new Error(`Delete failed: ${result.result}`);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

// Get image URL with transformations
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const transformations: string[] = [];
  
  if (options.width || options.height) {
    transformations.push(`c_fill`);
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
  }
  
  if (options.quality) {
    transformations.push(`q_${options.quality}`);
  } else {
    transformations.push(`q_auto:good`);
  }
  
  if (options.format) {
    transformations.push(`f_${options.format}`);
  } else {
    transformations.push(`f_auto`);
  }
  
  const transformationString = transformations.join(',');
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformationString,
  });
}

export default cloudinary;