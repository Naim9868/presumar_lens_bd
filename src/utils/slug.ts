import { Product } from '../models/Product';

export async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists
  let existingProduct = await Product.findOne({ slug, _id: { $ne: excludeId } });
  
  while (existingProduct) {
    slug = `${baseSlug}-${counter}`;
    existingProduct = await Product.findOne({ slug, _id: { $ne: excludeId } });
    counter++;
  }
  
  return slug;
}

export function generateBaseSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}