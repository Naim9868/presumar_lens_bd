'use client';

import { Bell } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  PageShell, Section, Grid2, Field, Input, SecretInput,
  Select, Toggle, StatusChip, InfoBox, Divider, SettingsSkeleton,
} from '@/components/admin/settings/SettingsUI';

const ORDER_EVENTS = [
  { key: 'notify_order_placed',       label: 'Order Placed',         desc: 'When a new order is created' },
  { key: 'notify_order_confirmed',    label: 'Order Confirmed',      desc: 'When admin confirms the order' },
  { key: 'notify_order_shipped',      label: 'Order Shipped',        desc: 'When courier is booked' },
  { key: 'notify_order_delivered',    label: 'Order Delivered',      desc: 'When delivery is confirmed' },
  { key: 'notify_order_cancelled',    label: 'Order Cancelled',      desc: 'When order is cancelled' },
  { key: 'notify_return_requested',   label: 'Return Requested',     desc: 'When customer submits return' },
];

export default function NotificationsSettingsClient() {
  const { settings: s, loading, saving, dirty, set, save } = useSettings('notifications');

  if (loading) return <SettingsSkeleton />;

  return (
    <PageShell
      title="Notifications"
      description="Configure email, WhatsApp and Telegram alerts for orders and admin"
      icon={<Bell className="w-5 h-5" />}
      dirty={dirty}
      saving={saving}
      onSave={save}
    >
      {/* Email — Brevo */}
      <Section title="Email — Brevo (Sendinblue)" description="Transactional emails for order confirmations, shipping updates"
        badge={s.brevo_api_key ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!s.brevo_api_key} />
          <Toggle value={s.email_enabled || 'false'} onChange={v => set('email_enabled', v)} label="Enable Email Notifications" description="" />
        </div>
        <Grid2>
          <Field label="Brevo API Key" required docUrl="https://app.brevo.com/settings/keys/api">
            <SecretInput value={s.brevo_api_key || ''} onChange={v => set('brevo_api_key', v)} placeholder="xkeysib-…" />
          </Field>
          <Field label="From Name" required>
            <Input value={s.email_from_name || ''} onChange={v => set('email_from_name', v)} placeholder="My Store" />
          </Field>
          <Field label="From Email" required>
            <Input value={s.email_from_address || ''} onChange={v => set('email_from_address', v)} placeholder="noreply@mystore.com" />
          </Field>
          <Field label="Reply-To Email">
            <Input value={s.email_reply_to || ''} onChange={v => set('email_reply_to', v)} placeholder="support@mystore.com" />
          </Field>
        </Grid2>
        <Divider label="OR use SMTP" />
        <Grid2>
          <Field label="SMTP Host" hint="e.g. smtp.gmail.com">
            <Input value={s.smtp_host || ''} onChange={v => set('smtp_host', v)} placeholder="smtp.gmail.com" />
          </Field>
          <Field label="SMTP Port">
            <Select value={s.smtp_port || '587'} onChange={v => set('smtp_port', v)}
              options={[{ value: '587', label: '587 (TLS)' }, { value: '465', label: '465 (SSL)' }, { value: '25', label: '25' }]} />
          </Field>
          <Field label="SMTP Username">
            <Input value={s.smtp_username || ''} onChange={v => set('smtp_username', v)} placeholder="you@gmail.com" monospace />
          </Field>
          <Field label="SMTP Password">
            <SecretInput value={s.smtp_password || ''} onChange={v => set('smtp_password', v)} placeholder="App password" />
          </Field>
        </Grid2>
      </Section>

      {/* WhatsApp */}
      <Section title="WhatsApp Cloud API" description="Send order updates via WhatsApp to customers"
        badge={s.whatsapp_token ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.whatsapp_token && s.whatsapp_phone_number_id)} />
          <Toggle value={s.whatsapp_enabled || 'false'} onChange={v => set('whatsapp_enabled', v)} label="Enable WhatsApp Notifications" description="" />
        </div>
        <InfoBox>
          Get credentials from Meta Business Suite → WhatsApp → Getting Started. You need a verified Business Account.
        </InfoBox>
        <div className="mt-4">
          <Grid2>
            <Field label="Phone Number ID" required docUrl="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started">
              <Input value={s.whatsapp_phone_number_id || ''} onChange={v => set('whatsapp_phone_number_id', v)} placeholder="1234567890" monospace />
            </Field>
            <Field label="WhatsApp Business Account ID">
              <Input value={s.whatsapp_waba_id || ''} onChange={v => set('whatsapp_waba_id', v)} placeholder="WABA ID" monospace />
            </Field>
            <Field label="System User Token" required hint="Permanent access token from Meta Business Suite">
              <SecretInput value={s.whatsapp_token || ''} onChange={v => set('whatsapp_token', v)} placeholder="EAAxxxx…" />
            </Field>
            <Field label="Webhook Verify Token" hint="Any random string you choose">
              <Input value={s.whatsapp_verify_token || ''} onChange={v => set('whatsapp_verify_token', v)} placeholder="my_verify_secret" monospace />
            </Field>
          </Grid2>
        </div>
      </Section>

      {/* Telegram */}
      <Section title="Telegram Bot" description="Admin alerts for new orders, fraud flags, daily summaries"
        badge={s.telegram_bot_token ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.telegram_bot_token && s.telegram_admin_chat_id)} />
          <Toggle value={s.telegram_enabled || 'false'} onChange={v => set('telegram_enabled', v)} label="Enable Telegram Alerts" description="" />
        </div>
        <InfoBox>
          Create a bot via @BotFather on Telegram. Get your Chat ID by messaging @userinfobot.
        </InfoBox>
        <div className="mt-4">
          <Grid2>
            <Field label="Bot Token" required docUrl="https://core.telegram.org/bots/api">
              <SecretInput value={s.telegram_bot_token || ''} onChange={v => set('telegram_bot_token', v)} placeholder="123456:ABCdefGHI…" />
            </Field>
            <Field label="Admin Chat ID" required hint="Your personal or group chat ID">
              <Input value={s.telegram_admin_chat_id || ''} onChange={v => set('telegram_admin_chat_id', v)} placeholder="-1001234567890" monospace />
            </Field>
            <Field label="Webhook Secret" hint="Optional — for webhook verification">
              <Input value={s.telegram_webhook_secret || ''} onChange={v => set('telegram_webhook_secret', v)} placeholder="my_secret" monospace />
            </Field>
          </Grid2>
        </div>
        <Divider />
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Alert Types</p>
          <Toggle value={s.telegram_new_order || 'true'} onChange={v => set('telegram_new_order', v)} label="New Order Alert" description="Instant Telegram message for every new order" />
          <Toggle value={s.telegram_fraud_alert || 'true'} onChange={v => set('telegram_fraud_alert', v)} label="Fraud Alert" description="Alert when high-risk order is placed" />
          <Toggle value={s.telegram_daily_summary || 'true'} onChange={v => set('telegram_daily_summary', v)} label="Daily Summary" description="Send daily revenue & order summary at midnight" />
        </div>
      </Section>

      {/* Per-event settings */}
      <Section title="Notification Events" description="Choose which channels fire for each event">
        <div className="space-y-0.5">
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Event</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">Email</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">WhatsApp</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">SMS</span>
          </div>
          {ORDER_EVENTS.map(({ key, label, desc }) => (
            <div key={key} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-50 items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              {['email', 'whatsapp', 'sms'].map(channel => (
                <div key={channel} className="flex justify-center">
                  <button type="button"
                    onClick={() => set(`${key}_${channel}`, s[`${key}_${channel}`] === 'false' ? 'true' : 'false')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${s[`${key}_${channel}`] !== 'false' ? 'bg-violet-600' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s[`${key}_${channel}`] !== 'false' ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
