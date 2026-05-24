// app/actions/brand.actions.ts
export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

export async function fetchBrands(): Promise<Brand[]> {
  try {
    const res = await fetch('/api/admin/brands');
    if (!res.ok) throw new Error('Failed to fetch brands');
    const data = await res.json();
    return data.brands || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}