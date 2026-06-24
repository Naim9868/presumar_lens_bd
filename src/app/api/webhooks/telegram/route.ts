import { NextRequest, NextResponse } from 'next/server';
import { parseTelegramUpdate, verifyTelegramWebhook, sendTelegramMessage } from '@/integrations/telegram';
import Order from '@/models/Order';
import { connectDB } from '@/lib/dbConnect';

// POST /api/webhooks/telegram
export async function POST(req: NextRequest) {
  try {
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token') || '';
    if (!verifyTelegramWebhook(secretToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const update = parseTelegramUpdate(body);

    if (!update) return NextResponse.json({ ok: true });

    const { chatId, text } = update;

    // Basic bot commands
    if (text?.startsWith('/order ')) {
      const orderId = text.replace('/order ', '').trim();
      await connectDB();

      const order = await Order.findOne({ orderId }).lean();
      if (order) {
        const msg =
          `📦 <b>Order #${order.orderId}</b>\n\n` +
          `👤 ${order.shipping.name}\n` +
          `📞 ${order.shipping.phone}\n` +
          `💰 ৳${order.pricing.total.toLocaleString()}\n` +
          `📊 Status: <b>${order.status}</b>\n` +
          `📅 ${new Date(order.createdAt).toLocaleDateString('en-BD')}`;
        await sendTelegramMessage(chatId.toString(), msg);
      } else {
        await sendTelegramMessage(chatId.toString(), `❌ Order <code>${orderId}</code> not found.`);
      }
    } else if (text === '/start') {
      await sendTelegramMessage(
        chatId.toString(),
        '👋 <b>Admin Bot</b>\n\nCommands:\n/order ORD-XXXX — lookup order'
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Telegram Webhook]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
