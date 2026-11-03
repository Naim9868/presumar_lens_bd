// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { getSettings, saveSettings } from '@/services/settings.service';

// Sensitive keys per group that should be stored encrypted / masked on read
const SENSITIVE_KEYS: Record<string, string[]> = {
  payment: ['sslcommerz_store_pass', 'bkash_app_secret', 'bkash_password', 'nagad_merchant_key'],
  api: [
    'steadfast_api_key',
    'meta_access_token',
    'tiktok_access_token',
    'ga4_api_secret',
    'pathao_client_secret',
    'pathao_password',
    'steadfast_secret_key',
    'redx_access_token',
    'redx_api_key',
    'paperfly_api_secret',
    'admin_api_key',
    'storefront_api_key',
    'webhook_secret',
  ],
  marketing: ['meta_access_token', 'tiktok_access_token', 'ga4_api_secret', 'whatsapp_token', 'telegram_bot_token'],
  sms: ['sms_api_key'],
  notifications: ['brevo_api_key', 'smtp_password'],
  general: [],
};

const SETTINGS_GROUPS = new Set(Object.keys(SENSITIVE_KEYS));

// GET /api/admin/settings?group=general
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const group = req.nextUrl.searchParams.get('group') || 'general';
    if (!SETTINGS_GROUPS.has(group)) {
      return NextResponse.json({ error: 'Invalid settings group' }, { status: 400 });
    }
    const settings = await getSettings(group);
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('[GET /api/admin/settings]', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// POST /api/admin/settings
// Body: { group: 'general', settings: { key: value, ... } }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { group, settings } = body;

    if (typeof group !== 'string' || !SETTINGS_GROUPS.has(group)) {
      return NextResponse.json({ error: 'Invalid settings group' }, { status: 400 });
    }

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json({ error: 'group and settings are required' }, { status: 400 });
    }

    const sensitive = SENSITIVE_KEYS[group] || [];
    const normalizedSettings: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'string') {
        return NextResponse.json({ error: `Setting "${key}" must be a string` }, { status: 400 });
      }
      normalizedSettings[key] = value;
    }

    await saveSettings(group, normalizedSettings, sensitive);

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    console.error('[POST /api/admin/settings]', err);
    return NextResponse.json(
      {
        error: 'Failed to save settings',
        ...(process.env.NODE_ENV === 'development' && {
          details: err instanceof Error ? err.message : 'Unknown settings error',
        }),
      },
      { status: 500 },
    );
  }
}
