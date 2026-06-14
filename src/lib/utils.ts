// src/lib/utils.ts
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateSKU(prefix: string = 'SKU'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}


export const generateUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  // This would need database access - implement based on your ORM
  return baseSlug;
};

export const generateVariantKey = (attributes: Array<{ key: string; value: string }>): string => {
  return attributes.map(attr => `${attr.key}:${attr.value}`).join('|');
};

export const normalizeString = (str: string): string => {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
};