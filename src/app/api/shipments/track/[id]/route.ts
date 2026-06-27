import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { trackShipment } from '@/services/shipment.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET /api/shipments/track/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const result = await trackShipment(id);
    return successResponse(result);
  } catch (err) {
    console.error('[GET /api/shipments/track/[id]]', err);
    return errorResponse((err as Error).message || 'Failed to track shipment', 500);
  }
}
