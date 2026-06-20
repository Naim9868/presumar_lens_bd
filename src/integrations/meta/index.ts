// src/integrations/meta/index.ts

interface MetaEventPayload {
  eventId: string;
  name: string;
  value?: number;
  orderId?: string;
  fbclid?: string;
}

export async function sendToMetaConversionsAPI(payload: MetaEventPayload) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) return;

  const eventMap: Record<string, string> = {
    purchase: 'Purchase',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    view_item: 'ViewContent',
    search: 'Search',
  };

  const metaEventName = eventMap[payload.name];
  if (!metaEventName) return;

  const body = {
    data: [
      {
        event_name: metaEventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: 'website',
        user_data: {
          fbc: payload.fbclid ? `fb.1.${Date.now()}.${payload.fbclid}` : undefined,
        },
        custom_data: {
          value: payload.value,
          currency: 'BDT',
          order_id: payload.orderId,
        },
      },
    ],
  };

  await fetch(
    `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}