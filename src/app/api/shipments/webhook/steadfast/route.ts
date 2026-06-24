import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { handleCourierWebhook } from '@/services/shipment.service';

// POST /api/shipments/webhook/steadfast
// SteadFast calls this when parcel status changes
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const payload = await req.json();
    console.log('[SteadFast Webhook]', JSON.stringify(payload));

    await handleCourierWebhook('STEADFAST', payload);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[SteadFast Webhook Error]', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
