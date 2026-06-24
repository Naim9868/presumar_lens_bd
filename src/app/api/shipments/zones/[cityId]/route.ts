import { NextRequest } from 'next/server';
import { getPathaoZoneList } from '@/services/shipment.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET /api/shipments/zones/[cityId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { cityId: string } }
) {
  try {
    const zones = await getPathaoZoneList(Number(params.cityId));
    return successResponse({ zones });
  } catch (err) {
    console.error('[GET /api/shipments/zones/[cityId]]', err);
    return errorResponse('Failed to fetch zones', 500);
  }
}
