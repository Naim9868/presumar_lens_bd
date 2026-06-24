// TikTok Events API — server-side
// Docs: https://business-api.tiktok.com/portal/docs

export interface TikTokEventPayload {
  eventId: string;
  name: string;
  value?: number;
  orderId?: string;
  ttclid?: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

const TIKTOK_EVENT_MAP: Record<string, string> = {
  purchase: 'PlaceAnOrder',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  view_item: 'ViewContent',
  search: 'Search',
  signup: 'CompleteRegistration',
  page_view: 'Pageview',
  wishlist: 'AddToWishlist',
};

export async function sendToTikTokEventsAPI(payload: TikTokEventPayload): Promise<void> {
  const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
  const PIXEL_ID = process.env.TIKTOK_PIXEL_ID;

  if (!ACCESS_TOKEN || !PIXEL_ID) return;

  const tiktokEvent = TIKTOK_EVENT_MAP[payload.name];
  if (!tiktokEvent) return;

  const body = {
    pixel_code: PIXEL_ID,
    ...(process.env.TIKTOK_TEST_EVENT_CODE && {
      test_event_code: process.env.TIKTOK_TEST_EVENT_CODE,
    }),
    timestamp: new Date().toISOString(),
    context: {
      user_agent: payload.userAgent,
      ip: payload.ip,
      ttclid: payload.ttclid,
    },
    data: [
      {
        event: tiktokEvent,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        properties: {
          value: payload.value,
          currency: 'BDT',
          order_id: payload.orderId,
        },
      },
    ],
  };

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': ACCESS_TOKEN,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.code !== 0) console.error('[TikTok Events API]', data.message);
  } catch (err) {
    console.error('[TikTok Events API]', err);
  }
}
