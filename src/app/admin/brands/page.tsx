// src/app/admin/brands/page.tsx
import { getBrands } from '@/app/actions/brand/getBrands';
import BrandsManager from '@/components/admin/BrandsManager';

export default async function BrandsPage() {
  const brands = await getBrands();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
        <p className="text-gray-500 mt-1">Manage your product brands and manufacturers</p>
      </div>
      
      <BrandsManager initialBrands={brands} />
    </div>
  );
}