import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { handleCourierWebhook } from '@/services/shipment.service';

// POST /api/shipments/webhook/redx
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const payload = await req.json();
    console.log('[RedX Webhook]', JSON.stringify(payload));

    await handleCourierWebhook('REDX', payload);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[RedX Webhook Error]', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
