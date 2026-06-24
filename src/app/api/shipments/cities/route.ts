import { NextRequest } from 'next/server';
import { getPathaoCityList } from '@/services/shipment.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET /api/shipments/cities — Pathao city list for dropdown
export async function GET(_req: NextRequest) {
  try {
    const cities = await getPathaoCityList();
    return successResponse({ cities });
  } catch (err) {
    console.error('[GET /api/shipments/cities]', err);
    return errorResponse('Failed to fetch cities', 500);
  }
}
