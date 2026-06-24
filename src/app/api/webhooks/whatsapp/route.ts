import { NextRequest, NextResponse } from 'next/server';
import { parseWhatsAppWebhook } from '@/integrations/whatsapp';

// GET /api/webhooks/whatsapp — Meta verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST /api/webhooks/whatsapp — incoming messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = parseWhatsAppWebhook(body);

    if (message) {
      console.log('[WhatsApp Incoming]', message);
      // Add your auto-reply or order-lookup logic here
      // e.g. if message.text === 'ORDER ORD-XXXX' → send order status
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[WhatsApp Webhook]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
