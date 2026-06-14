// src/app/admin/products/[id]/not-found.tsx
import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>
    </div>
  );
}