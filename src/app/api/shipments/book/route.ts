// /api/shipments/book
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { bookShipment } from '@/services/shipment.service';
import { getCourierSettings } from '@/services/courier-config.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/shipments/book
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { orderId, provider, pathao: requestedPathao } = await req.json();

    if (!orderId) return errorResponse('Order ID required');
    if (!provider) return errorResponse('Courier provider required');

    const validProviders = ['STEADFAST', 'PATHAO', 'REDX'];
    if (!validProviders.includes(provider)) {
      return errorResponse(`Invalid provider. Choose: ${validProviders.join(', ')}`);
    }

    const settings = await getCourierSettings();
    if (provider === 'STEADFAST' && (!settings.steadfastApiKey || !settings.steadfastSecretKey)) {
      return errorResponse('Configure SteadFast API Key and Secret Key in Admin > Settings > API');
    }
    if (provider === 'REDX' && !settings.redxAccessToken) {
      return errorResponse('Configure RedX Access Token in Admin > Settings > API');
    }

    let pathao = requestedPathao;
    if (provider === 'PATHAO' && !pathao) {
      pathao = {
        storeId: Number(settings.pathaoStoreId),
        cityId: Number(settings.pathaoCityId),
        zoneId: Number(settings.pathaoZoneId),
        deliveryType: Number(settings.pathaoDeliveryType),
        itemWeight: Number(settings.pathaoItemWeight),
      };
    }

    if (
      provider === 'PATHAO' &&
      (!pathao ||
        !Number.isFinite(pathao.storeId) ||
        !Number.isFinite(pathao.cityId) ||
        !Number.isFinite(pathao.zoneId) ||
        !Number.isFinite(pathao.deliveryType) ||
        !Number.isFinite(pathao.itemWeight) ||
        pathao.storeId <= 0 ||
        pathao.cityId <= 0 ||
        pathao.zoneId <= 0 ||
        pathao.itemWeight <= 0)
    ) {
      return errorResponse(
        'Configure Pathao store, city, zone, delivery type, and item weight in Admin > Settings > API'
      );
    }

    const shipment = await bookShipment({ orderId, provider, pathao });
    return successResponse({ shipment }, 201);
  } catch (err) {
    console.error('[POST /api/shipments/book]', err);
    return errorResponse((err as Error).message || 'Failed to book shipment', 500);
  }
}
