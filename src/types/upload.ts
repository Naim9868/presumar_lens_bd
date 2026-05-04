// types/upload.ts
export interface UploadResponse {
  success: boolean;
  url: string;
  publicId: string;
}

export interface ImageUploaderProps {
  images: string[];
  onChange?: (images: string[]) => void;
  onUpload?: (images: string[]) => void;
  maxImages?: number;
}