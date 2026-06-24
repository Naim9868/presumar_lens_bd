import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { trackEvent } from '@/services/tracking.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/track — browser-side event tracking
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name, sessionId, value, productId, orderId,
      utm, fbclid, gclid, ttclid, page, metadata,
    } = body;

    if (!name) return errorResponse('Event name required');
    if (!sessionId) return errorResponse('Session ID required');

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;
    const userId = req.headers.get('x-user-id') || undefined;

    const eventId = await trackEvent({
      name,
      userId,
      sessionId,
      value,
      productId,
      orderId,
      utm,
      fbclid,
      gclid,
      ttclid,
      page,
      ip,
      userAgent,
      metadata,
    });

    return successResponse({ eventId });
  } catch (err) {
    console.error('[POST /api/track]', err);
    return errorResponse('Tracking failed', 500);
  }
}
