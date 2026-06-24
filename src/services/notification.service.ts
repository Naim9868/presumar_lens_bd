import Order from '@/models/Order';
import { IOrder } from '@/models/Order';

// ─────────────────────────────────────────────
// WhatsApp Cloud API
// ─────────────────────────────────────────────
async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  // Normalize BD phone number
  const normalized = phone.startsWith('0') ? `880${phone.slice(1)}` : phone;

  await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalized,
      type: 'text',
      text: { body: message },
    }),
  });
}

// ─────────────────────────────────────────────
// SMS (Generic — replace with local BD SMS provider)
// ─────────────────────────────────────────────
async function sendSMS(phone: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'ECOM';
  if (!apiKey) return;

  // Example: BulkSMSBD / SSL Wireless / Twilio
  await fetch(`${process.env.SMS_API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      senderid: senderId,
      number: phone,
      message,
    }),
  });
}

// ─────────────────────────────────────────────
// Email (Nodemailer / Brevo)
// ─────────────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: process.env.STORE_NAME || 'Store', email: process.env.STORE_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: body,
    }),
  });
}

// ─────────────────────────────────────────────
// Telegram (broadcast to channel/group)
// ─────────────────────────────────────────────
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}

// ─────────────────────────────────────────────
// Message templates
// ─────────────────────────────────────────────
function getMessageTemplate(event: string, order: IOrder): string {
  const storeName = process.env.STORE_NAME || 'Store';
  const total = `৳${order.pricing.total.toLocaleString()}`;
  const name = order.shipping.name;
  const orderId = order.orderId;

  const templates: Record<string, string> = {
    ORDER_PLACED: `✅ *${storeName}*\nHello ${name}!\n\nYour order *${orderId}* has been placed successfully.\nTotal: *${total}*\n\nWe'll confirm your order shortly. Thank you! 🛍️`,

    STATUS_CONFIRMED: `✅ *${storeName}*\nDear ${name}, your order *${orderId}* has been confirmed!\n\nWe are preparing your items. You will be notified once shipped.`,

    STATUS_SHIPPED: `🚚 *${storeName}*\nGreat news, ${name}! Your order *${orderId}* has been shipped.\n\nTrack your delivery to stay updated.`,

    STATUS_DELIVERED: `🎉 *${storeName}*\nYour order *${orderId}* has been delivered!\n\nThank you for shopping with us, ${name}. We hope you love your purchase! ❤️`,

    STATUS_CANCELLED: `❌ *${storeName}*\nDear ${name}, your order *${orderId}* has been cancelled.\n\nIf you have any questions, please contact us.`,
  };

  return templates[event] || `Order ${orderId} status update: ${event}`;
}

function getEmailTemplate(event: string, order: IOrder): { subject: string; body: string } {
  const storeName = process.env.STORE_NAME || 'Store';
  const total = `৳${order.pricing.total.toLocaleString()}`;
  const orderId = order.orderId;

  const subjects: Record<string, string> = {
    ORDER_PLACED: `Order Confirmed — ${orderId}`,
    STATUS_CONFIRMED: `Your order ${orderId} is confirmed`,
    STATUS_SHIPPED: `Your order ${orderId} has shipped`,
    STATUS_DELIVERED: `Order ${orderId} delivered!`,
    STATUS_CANCELLED: `Order ${orderId} cancelled`,
  };

  const body = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h2 style="color:#222;">${storeName}</h2>
      <p>Dear ${order.shipping.name},</p>
      <p>${getMessageTemplate(event, order).replace(/\*/g, '<b>').replace(/_/g, '')}</p>
      <hr/>
      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Total:</b> ${total}</p>
      <p><b>Delivery:</b> ${order.shipping.address}, ${order.shipping.area}, ${order.shipping.city}</p>
      <hr/>
      <p style="color:#888;font-size:12px;">Thank you for shopping with ${storeName}</p>
    </div>
  `;

  return { subject: subjects[event] || `Order Update — ${orderId}`, body };
}

// ─────────────────────────────────────────────
// Main send function
// ─────────────────────────────────────────────
export async function sendOrderNotification(order: IOrder, event: string): Promise<void> {
  const message = getMessageTemplate(event, order);
  const phone = order.shipping.phone;
  const email = order.shipping.email || order.guestEmail;

  const tasks: Promise<void>[] = [];

  // WhatsApp
  tasks.push(sendWhatsApp(phone, message).catch(console.error));

  // SMS
  tasks.push(sendSMS(phone, message.replace(/\*/g, '').replace(/_/g, '')).catch(console.error));

  // Email
  if (email) {
    const { subject, body } = getEmailTemplate(event, order);
    tasks.push(sendEmail(email, subject, body).catch(console.error));
  }

  // Telegram admin alert for new orders
  if (event === 'ORDER_PLACED') {
    const adminMsg = `🛍 <b>New Order!</b>\n#${order.orderId}\n${order.shipping.name} — ৳${order.pricing.total}\nItems: ${order.items.length}`;
    tasks.push(sendTelegramAlert(adminMsg).catch(console.error));
  }

  await Promise.allSettled(tasks);

  // Mark notifications as sent
  await Order.findByIdAndUpdate(order._id, {
    'notifications.sms': true,
    'notifications.email': !!email,
    'notifications.whatsapp': true,
  });
}
