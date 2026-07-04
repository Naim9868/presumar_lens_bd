// src/app/api/admin/settings/sms/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { getRawSettings } from '@/services/settings.service';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message required' }, { status: 400 });
    }

    const s = await getRawSettings('sms');

    if (!s.sms_api_key) {
      return NextResponse.json({ error: 'SMS API key not configured. Save settings first.' }, { status: 400 });
    }

    const apiUrl = s.sms_api_url;
    if (!apiUrl) {
      return NextResponse.json({ error: 'SMS API URL not configured' }, { status: 400 });
    }

    let result: Record<string, unknown> = {};

    if (s.sms_provider === 'twilio') {
      // Twilio format
      const creds = Buffer.from(`${s.twilio_account_sid}:${s.sms_api_key}`).toString('base64');
      const body = new URLSearchParams({
        To: phone.startsWith('+') ? phone : `+880${phone.replace(/^0/, '')}`,
        From: s.twilio_phone_number || '',
        Body: message,
      });
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      result = await res.json();
    } else {
      // Generic GET/POST (BulkSMSBD, SSL Wireless, etc.)
      const extraParams = s.sms_extra_params ? JSON.parse(s.sms_extra_params) : {};
      const params = new URLSearchParams({
        api_key: s.sms_api_key,
        senderid: s.sms_sender_id || 'STORE',
        [s.sms_phone_param || 'number']: phone,
        [s.sms_message_param || 'message']: message,
        ...extraParams,
      });

      if (s.sms_method === 'POST') {
        const res = await fetch(apiUrl, { method: 'POST', body: params,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        result = await res.json().catch(() => ({ status: res.status }));
      } else {
        const res = await fetch(`${apiUrl}?${params.toString()}`);
        result = await res.json().catch(() => ({ status: res.status }));
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('[SMS Test]', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed' }, { status: 500 });
  }
}
