import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { handleCourierWebhook } from '@/services/shipment.service';

// POST /api/shipments/webhook/pathao
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const payload = await req.json();
    console.log('[Pathao Webhook]', JSON.stringify(payload));

    await handleCourierWebhook('PATHAO', payload);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Pathao Webhook Error]', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
