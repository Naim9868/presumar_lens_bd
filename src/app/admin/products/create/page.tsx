// app/admin/products/create/page.tsx
'use client';

import { ProductForm } from '@/app/admin/components/ProductForm';

export default function CreateProductPage() {
  return <ProductForm isEditing={false} />;
}