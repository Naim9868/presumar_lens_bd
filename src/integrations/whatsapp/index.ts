// WhatsApp Cloud API Integration — Meta
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const WA_API = 'https://graph.facebook.com/v18.0';

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function getPhoneNumberId() {
  return process.env.WHATSAPP_PHONE_NUMBER_ID;
}

// Normalize BD phone: 01XXXXXXXXX → 8801XXXXXXXXX
function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880')) return cleaned;
  if (cleaned.startsWith('0')) return `880${cleaned.slice(1)}`;
  return `880${cleaned}`;
}

// ─── Send plain text message ───────────────────────────────
export async function sendWhatsAppText(phone: string, message: string): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  if (!phoneNumberId || !process.env.WHATSAPP_TOKEN) return;

  const to = normalizeBDPhone(phone);

  try {
    const res = await fetch(`${WA_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await res.json();
    if (data.error) console.error('[WhatsApp Text]', data.error);
  } catch (err) {
    console.error('[WhatsApp Text Error]', err);
  }
}

// ─── Send template message (approved templates only) ───────
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  languageCode: string = 'en_US',
  components: unknown[] = []
): Promise<void> {
  const phoneNumberId = getPhoneNumberId();
  if (!phoneNumberId || !process.env.WHATSAPP_TOKEN) return;

  const to = normalizeBDPhone(phone);

  try {
    const res = await fetch(`${WA_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await res.json();
    if (data.error) console.error('[WhatsApp Template]', data.error);
  } catch (err) {
    console.error('[WhatsApp Template Error]', err);
  }
}

// ─── Send order confirmation (text fallback) ───────────────
export async function sendOrderConfirmation(
  phone: string,
  orderId: string,
  total: number,
  customerName: string
): Promise<void> {
  const storeName = process.env.STORE_NAME || 'Our Store';
  const message =
    `✅ *${storeName}*\n\n` +
    `Hello ${customerName}!\n\n` +
    `Your order *#${orderId}* has been placed successfully.\n` +
    `Total: *৳${total.toLocaleString()}*\n\n` +
    `We'll notify you when your order ships. Thank you! 🛍️`;

  await sendWhatsAppText(phone, message);
}

// ─── Send shipping notification ────────────────────────────
export async function sendShippingNotification(
  phone: string,
  orderId: string,
  trackingId: string,
  trackingUrl?: string
): Promise<void> {
  const storeName = process.env.STORE_NAME || 'Our Store';
  const message =
    `🚚 *${storeName}*\n\n` +
    `Your order *#${orderId}* has been shipped!\n\n` +
    `Tracking ID: *${trackingId}*\n` +
    (trackingUrl ? `Track: ${trackingUrl}\n` : '') +
    `\nThank you for shopping with us!`;

  await sendWhatsAppText(phone, message);
}

// ─── Handle incoming WhatsApp webhook ──────────────────────
export function parseWhatsAppWebhook(body: Record<string, unknown>) {
  try {
    const entry = (body.entry as any[])?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages?.length) return null;

    const msg = messages[0];
    return {
      from: msg.from,
      messageId: msg.id,
      type: msg.type,
      text: msg.text?.body || null,
      timestamp: msg.timestamp,
    };
  } catch {
    return null;
  }
}
