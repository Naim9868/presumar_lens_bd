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
    const brandRes = await res.json();
    return brandRes.data|| [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}