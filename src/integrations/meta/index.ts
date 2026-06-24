// Meta Conversions API — server-side pixel
// Docs: https://developers.facebook.com/docs/marketing-api/conversions-api

export interface MetaEventPayload {
  eventId: string;
  name: string;
  value?: number;
  orderId?: string;
  fbclid?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  source?: string;
}

const META_EVENT_MAP: Record<string, string> = {
  purchase: 'Purchase',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  view_item: 'ViewContent',
  search: 'Search',
  signup: 'CompleteRegistration',
  wishlist: 'AddToWishlist',
  page_view: 'PageView',
};

export async function sendToMetaConversionsAPI(payload: MetaEventPayload): Promise<void> {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const TEST_CODE = process.env.META_TEST_EVENT_CODE;

  if (!PIXEL_ID || !ACCESS_TOKEN) return;

  const metaEventName = META_EVENT_MAP[payload.name];
  if (!metaEventName) return;

  const eventData: Record<string, unknown> = {
    event_name: metaEventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: payload.eventId,
    event_source_url: process.env.NEXT_PUBLIC_APP_URL,
    action_source: 'website',
    user_data: {
      client_ip_address: payload.ip,
      client_user_agent: payload.userAgent,
      ...(payload.fbclid && {
        fbc: `fb.1.${Date.now()}.${payload.fbclid}`,
      }),
    },
    custom_data: {
      value: payload.value,
      currency: 'BDT',
      order_id: payload.orderId,
    },
  };

  const body: Record<string, unknown> = { data: [eventData] };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (data.error) console.error('[Meta CAPI Error]', data.error);
  } catch (err) {
    console.error('[Meta CAPI]', err);
  }
}
