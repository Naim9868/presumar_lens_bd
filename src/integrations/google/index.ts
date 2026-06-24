// Google Analytics 4 — Measurement Protocol
// Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4

export interface GA4EventPayload {
  eventId: string;
  name: string;
  value?: number;
  orderId?: string;
  userId?: string;
  sessionId?: string;
}

const GA4_EVENT_MAP: Record<string, string> = {
  purchase: 'purchase',
  add_to_cart: 'add_to_cart',
  begin_checkout: 'begin_checkout',
  view_item: 'view_item',
  search: 'search',
  signup: 'sign_up',
  page_view: 'page_view',
  wishlist: 'add_to_wishlist',
};

export async function sendToGA4(payload: GA4EventPayload): Promise<void> {
  const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
  const API_SECRET = process.env.GA4_API_SECRET;

  if (!MEASUREMENT_ID || !API_SECRET) return;

  const ga4Event = GA4_EVENT_MAP[payload.name];
  if (!ga4Event) return;

  const body = {
    client_id: payload.userId || payload.sessionId || 'server-side',
    events: [
      {
        name: ga4Event,
        params: {
          transaction_id: payload.orderId,
          value: payload.value,
          currency: 'BDT',
          engagement_time_msec: 100,
        },
      },
    ],
  };

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  } catch (err) {
    console.error('[GA4 MP]', err);
  }
}
