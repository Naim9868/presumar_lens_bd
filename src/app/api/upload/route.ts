// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadImageBuffer, deleteImage } from '@/lib/cloudinary';

// Route Segment Config for Next.js App Router
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60; // Max 60 seconds for uploads

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function parseFormData(request: NextRequest): Promise<{ file: File; folder: string }> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'products';
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
    
    return { file, folder };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse form data');
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse the request
    const { file, folder } = await parseFormData(request);
    
    // Log upload start (for debugging)
    console.log(`[Upload] Starting: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary
    const result = await uploadImageBuffer(buffer, file.name, folder);
    
    const duration = Date.now() - startTime;
    console.log(`[Upload] Success: ${file.name} in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Upload] Failed after ${duration}ms:`, error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Upload timeout. Please try with a smaller image.' },
          { status: 408 }
        );
      }
      
      if (error.message.includes('size exceeds')) {
        return NextResponse.json(
          { error: error.message },
          { status: 413 }
        );
      }
      
      if (error.message.includes('file type')) {
        return NextResponse.json(
          { error: error.message },
          { status: 415 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId } = body;
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'No publicId provided' },
        { status: 400 }
      );
    }
    
    await deleteImage(publicId);
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
    
  } catch (error) {
    console.error('[Delete] Error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    );
  }
}