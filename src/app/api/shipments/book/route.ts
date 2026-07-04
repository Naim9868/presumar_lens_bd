// /api/shipments/book
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { bookShipment } from '@/services/shipment.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/shipments/book
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { orderId, provider, pathao } = await req.json();

    if (!orderId) return errorResponse('Order ID required');
    if (!provider) return errorResponse('Courier provider required');

    const validProviders = ['STEADFAST', 'PATHAO', 'REDX'];
    if (!validProviders.includes(provider)) {
      return errorResponse(`Invalid provider. Choose: ${validProviders.join(', ')}`);
    }

    if (provider === 'PATHAO' && !pathao) {
      return errorResponse('Pathao config required (storeId, cityId, zoneId, deliveryType, itemWeight)');
    }

    const shipment = await bookShipment({ orderId, provider, pathao });
    return successResponse({ shipment }, 201);
  } catch (err) {
    console.error('[POST /api/shipments/book]', err);
    return errorResponse((err as Error).message || 'Failed to book shipment', 500);
  }
}
