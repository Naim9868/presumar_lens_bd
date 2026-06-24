// Telegram Bot API Integration
// Docs: https://core.telegram.org/bots/api

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ─── Send message to admin chat/channel ───────────────────
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await res.json();
    if (!data.ok) console.error('[Telegram]', data.description);
  } catch (err) {
    console.error('[Telegram Error]', err);
  }
}

// ─── Send to admin channel (from env) ─────────────────────
export async function sendAdminAlert(message: string): Promise<void> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) return;
  await sendTelegramMessage(chatId, message);
}

// ─── New order alert to admin ─────────────────────────────
export async function sendNewOrderAlert(order: {
  orderId: string;
  shipping: { name: string; phone: string; city: string };
  pricing: { total: number };
  items: { snapshot: { name: string }; quantity: number }[];
  payment: { method: string };
  marketing?: { source?: string };
}): Promise<void> {
  const storeName = process.env.STORE_NAME || 'Store';
  const itemList = order.items
    .map((i) => `• ${i.snapshot.name} × ${i.quantity}`)
    .join('\n');

  const msg =
    `🛍 <b>New Order — ${storeName}</b>\n\n` +
    `📦 <b>#${order.orderId}</b>\n` +
    `👤 ${order.shipping.name} (${order.shipping.phone})\n` +
    `📍 ${order.shipping.city}\n` +
    `💰 ৳${order.pricing.total.toLocaleString()} — ${order.payment.method}\n` +
    (order.marketing?.source ? `📣 Source: ${order.marketing.source}\n` : '') +
    `\n<b>Items:</b>\n${itemList}`;

  await sendAdminAlert(msg);
}

// ─── Shipment alert to admin ──────────────────────────────
export async function sendShipmentAlert(
  orderId: string,
  provider: string,
  trackingId: string
): Promise<void> {
  const msg =
    `🚚 <b>Shipment Booked</b>\n\n` +
    `Order: <code>#${orderId}</code>\n` +
    `Courier: ${provider}\n` +
    `Tracking: <code>${trackingId}</code>`;

  await sendAdminAlert(msg);
}

// ─── Daily summary alert ──────────────────────────────────
export async function sendDailySummary(stats: {
  orders: number;
  revenue: number;
  pending: number;
}): Promise<void> {
  const msg =
    `📊 <b>Daily Summary</b>\n\n` +
    `📦 Orders: <b>${stats.orders}</b>\n` +
    `💰 Revenue: <b>৳${stats.revenue.toLocaleString()}</b>\n` +
    `⏳ Pending: <b>${stats.pending}</b>`;

  await sendAdminAlert(msg);
}

// ─── Handle incoming Telegram webhook ─────────────────────
export function parseTelegramUpdate(body: Record<string, unknown>) {
  const message = (body as any).message;
  if (!message) return null;

  return {
    chatId: message.chat?.id,
    text: message.text,
    from: message.from?.username || message.from?.first_name,
    messageId: message.message_id,
  };
}

// ─── Verify Telegram webhook (secret token) ───────────────
export function verifyTelegramWebhook(secretToken: string): boolean {
  return secretToken === process.env.TELEGRAM_WEBHOOK_SECRET;
}
