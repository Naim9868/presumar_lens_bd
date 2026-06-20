// src/services/tracking.service.ts
import { v4 as uuidv4 } from 'uuid';
import MarketingEvent from '@/models/MarketingEvent';
import { sendToMetaConversionsAPI } from '@/integrations/meta';
import { sendToTikTokEventsAPI } from '@/integrations/tiktok';

interface TrackPayload {
  name: string;
  userId?: string;
  sessionId: string;
  value?: number;
  productId?: string;
  orderId?: string;
  utm?: Record<string, string>;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(payload: TrackPayload) {
  const eventId = uuidv4();

  // Save to MongoDB
  await MarketingEvent.create({
    eventId,
    name: payload.name,
    userId: payload.userId,
    sessionId: payload.sessionId,
    value: payload.value,
    productId: payload.productId,
    orderId: payload.orderId,
    utm: payload.utm,
    fbclid: payload.fbclid,
    gclid: payload.gclid,
    ttclid: payload.ttclid,
    page: payload.page,
    currency: 'BDT',
    metadata: payload.metadata,
  });

  // Forward to ad platforms (non-blocking)
  if (payload.name === 'purchase' && payload.orderId) {
    sendToMetaConversionsAPI({ eventId, ...payload }).catch(console.error);
    sendToTikTokEventsAPI({ eventId, ...payload }).catch(console.error);
  }

  return eventId;
}