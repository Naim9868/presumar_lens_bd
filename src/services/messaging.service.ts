import Order, { IOrder } from '@/models/Order';
import { getRawSettings } from '@/services/settings.service';

export type MessageChannel = 'WHATSAPP' | 'SMS';

export interface MessageResult {
  channel: MessageChannel;
  fallback: boolean;
}

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880')) return cleaned;
  return cleaned.startsWith('0') ? `880${cleaned.slice(1)}` : `880${cleaned}`;
}

function plainMessage(message: string) {
  return message.replace(/[*_]/g, '');
}

export function renderOrderMessage(template: string, order: IOrder) {
  return template
    .replace(/\{name\}/gi, order.shipping.name || '')
    .replace(/\{orderId\}/gi, order.orderId || '')
    .replace(/\{total\}/gi, `৳${(order.pricing.total || 0).toLocaleString()}`)
    .replace(/\{status\}/gi, order.status || '')
    .replace(/\{phone\}/gi, order.shipping.phone || '');
}

export function defaultOrderMessage(order: IOrder) {
  return `Hello ${order.shipping.name}, your order ${order.orderId} is currently ${order.status}. Total: ৳${(order.pricing.total || 0).toLocaleString()}. Thank you for shopping with us.`;
}

async function sendWhatsApp(phone: string, message: string, settings: Record<string, string>) {
  const token = settings.whatsapp_token || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = settings.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error('WhatsApp is not configured');

  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(phone),
      type: 'text',
      text: { body: message },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `WhatsApp request failed (${response.status})`);
  }
}

async function sendSms(phone: string, message: string, settings: Record<string, string>) {
  const apiKey = settings.sms_api_key;
  const apiUrl = settings.sms_api_url;
  if (!apiKey || !apiUrl || settings.sms_enabled === 'false') {
    throw new Error('SMS provider is not configured or enabled');
  }

  if (settings.sms_provider === 'twilio') {
    const body = new URLSearchParams({
      To: `+${normalizePhone(phone)}`,
      From: settings.twilio_phone_number || '',
      Body: plainMessage(message),
    });
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${settings.twilio_account_sid}:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!response.ok) throw new Error(`SMS provider failed (${response.status})`);
    return;
  }

  let extra: Record<string, string> = {};
  if (settings.sms_extra_params) {
    try { extra = JSON.parse(settings.sms_extra_params); }
    catch { throw new Error('SMS extra parameters must be valid JSON'); }
  }
  const params = new URLSearchParams({
    api_key: apiKey,
    senderid: settings.sms_sender_id || 'STORE',
    [settings.sms_phone_param || 'number']: phone,
    [settings.sms_message_param || 'message']: plainMessage(message),
    ...extra,
  });
  const response = await fetch(
    settings.sms_method === 'POST' ? apiUrl : `${apiUrl}?${params.toString()}`,
    settings.sms_method === 'POST'
      ? { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params }
      : { method: 'GET' },
  );
  if (!response.ok) throw new Error(`SMS provider failed (${response.status})`);
}

export async function sendOrderMessage(order: IOrder, message: string): Promise<MessageResult> {
  const [smsSettings, notificationSettings] = await Promise.all([
    getRawSettings('sms'),
    getRawSettings('notifications'),
  ]);
  try {
    await sendWhatsApp(order.shipping.phone, message, notificationSettings);
    await Order.findByIdAndUpdate(order._id, { 'notifications.whatsapp': true });
    return { channel: 'WHATSAPP', fallback: false };
  } catch (whatsappError) {
    try {
      await sendSms(order.shipping.phone, message, smsSettings);
      await Order.findByIdAndUpdate(order._id, { 'notifications.sms': true });
      return { channel: 'SMS', fallback: true };
    } catch (smsError) {
      throw new Error(`WhatsApp failed: ${(whatsappError as Error).message}. SMS fallback failed: ${(smsError as Error).message}`);
    }
  }
}
