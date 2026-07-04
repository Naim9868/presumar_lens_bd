'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '@/hooks/useSettings';
import {
  PageShell, Section, Grid2, Field, Input, SecretInput,
  Select, Toggle, StatusChip, InfoBox, Divider, SettingsSkeleton, Textarea,
} from '@/components/admin/settings/SettingsUI';

const BD_PROVIDERS = [
  { value: 'bulksmsbd',  label: 'BulkSMSBD (bulksmsbd.net)' },
  { value: 'sslwireless', label: 'SSL Wireless' },
  { value: 'twilio',    label: 'Twilio' },
  { value: 'alpha',     label: 'Alpha SMS' },
  { value: 'custom',    label: 'Custom HTTP API' },
];

const PROVIDER_API_URL: Record<string, string> = {
  bulksmsbd:  'https://bulksmsbd.net/api/smsapi',
  sslwireless: 'https://sms.sslwireless.com/pushapi/dynamic/server.php',
  twilio:     'https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID/Messages.json',
  alpha:      'https://api.smsglobal.com/http-api.php',
  custom:     '',
};

const SMS_TEMPLATES = [
  { key: 'sms_tpl_order_placed',    label: 'Order Placed',    vars: '{name}, {orderId}, {total}' },
  { key: 'sms_tpl_order_confirmed', label: 'Order Confirmed', vars: '{name}, {orderId}' },
  { key: 'sms_tpl_order_shipped',   label: 'Order Shipped',   vars: '{name}, {orderId}, {trackingId}' },
  { key: 'sms_tpl_order_delivered', label: 'Order Delivered', vars: '{name}, {orderId}' },
  { key: 'sms_tpl_order_cancelled', label: 'Order Cancelled', vars: '{name}, {orderId}' },
];

export default function SmsSettingsClient() {
  const { settings: s, loading, saving, dirty, set, save } = useSettings('sms');
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Test message from your store!');
  const [sending, setSending] = useState(false);

  if (loading) return <SettingsSkeleton />;

  const handleTestSMS = async () => {
    if (!testPhone.trim()) return toast.error('Enter a phone number');
    setSending(true);
    try {
      const res = await fetch('/api/admin/settings/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMsg }),
      });
      const data = await res.json();
      if (data.success) toast.success('Test SMS sent!');
      else toast.error(data.error || 'Failed to send test SMS');
    } catch { toast.error('Failed'); }
    finally { setSending(false); }
  };

  const handleProviderChange = (provider: string) => {
    set('sms_provider', provider);
    if (PROVIDER_API_URL[provider]) set('sms_api_url', PROVIDER_API_URL[provider]);
  };

  return (
    <PageShell
      title="SMS Settings"
      description="Configure SMS provider and message templates for order notifications"
      icon={<MessageSquare className="w-5 h-5" />}
      dirty={dirty}
      saving={saving}
      onSave={save}
    >
      {/* Provider */}
      <Section title="SMS Provider" description="Connect your Bangladesh SMS gateway"
        badge={s.sms_api_key ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.sms_api_key && s.sms_provider)} />
          <Toggle value={s.sms_enabled || 'false'} onChange={v => set('sms_enabled', v)} label="Enable SMS Notifications" description="" />
        </div>
        <Grid2>
          <Field label="SMS Provider" required>
            <Select value={s.sms_provider || ''} onChange={handleProviderChange}
              options={[{ value: '', label: 'Select a provider' }, ...BD_PROVIDERS]} />
          </Field>
          <Field label="Sender ID / Mask" hint="Approved sender ID (e.g. MYSTORE)">
            <Input value={s.sms_sender_id || ''} onChange={v => set('sms_sender_id', v)} placeholder="MYSTORE" monospace />
          </Field>
          <Field label="API Key / Token" required>
            <SecretInput value={s.sms_api_key || ''} onChange={v => set('sms_api_key', v)} placeholder="Your API key" />
          </Field>
          <Field label="API URL" hint="Auto-filled when you select a provider above">
            <Input value={s.sms_api_url || ''} onChange={v => set('sms_api_url', v)} placeholder="https://api.smsprovider.com/send" monospace />
          </Field>
          {s.sms_provider === 'twilio' && (
            <>
              <Field label="Twilio Account SID">
                <Input value={s.twilio_account_sid || ''} onChange={v => set('twilio_account_sid', v)} placeholder="ACxxxxxxxx" monospace />
              </Field>
              <Field label="Twilio Phone Number">
                <Input value={s.twilio_phone_number || ''} onChange={v => set('twilio_phone_number', v)} placeholder="+18005551234" monospace />
              </Field>
            </>
          )}
        </Grid2>

        {/* Advanced */}
        <Divider label="Advanced" />
        <Grid2>
          <Field label="Request Method">
            <Select value={s.sms_method || 'GET'} onChange={v => set('sms_method', v)}
              options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]} />
          </Field>
          <Field label="Phone Param Name" hint="Query param name for phone number">
            <Input value={s.sms_phone_param || 'number'} onChange={v => set('sms_phone_param', v)} placeholder="number" monospace />
          </Field>
          <Field label="Message Param Name" hint="Query param name for message text">
            <Input value={s.sms_message_param || 'message'} onChange={v => set('sms_message_param', v)} placeholder="message" monospace />
          </Field>
          <Field label="Extra Params (JSON)" hint='e.g. {"api_key":"xxx"}'>
            <Input value={s.sms_extra_params || ''} onChange={v => set('sms_extra_params', v)} placeholder='{"senderid":"STORE"}' monospace />
          </Field>
        </Grid2>
      </Section>

      {/* Test SMS */}
      <Section title="Test SMS" description="Send a test message to verify your configuration">
        <InfoBox>
          Save your settings above before sending a test. The test uses your current saved API key and sender ID.
        </InfoBox>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Test Phone Number" required>
            <Input value={testPhone} onChange={setTestPhone} placeholder="01700000000" />
          </Field>
          <Field label="Test Message">
            <Input value={testMsg} onChange={setTestMsg} placeholder="Test message" />
          </Field>
        </div>
        <div className="mt-4">
          <button onClick={handleTestSMS} disabled={sending || !testPhone}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Send className="w-4 h-4" />
            {sending ? 'Sending…' : 'Send Test SMS'}
          </button>
        </div>
      </Section>

      {/* Message Templates */}
      <Section title="Message Templates" description="Customize the SMS sent for each order event. Use {variables} shown below each field.">
        <div className="space-y-5">
          {SMS_TEMPLATES.map(({ key, label, vars }) => (
            <Field key={key} label={label} hint={`Available: ${vars}`}>
              <Textarea
                value={s[key] || ''}
                onChange={v => set(key, v)}
                placeholder={`Enter message template for ${label.toLowerCase()}…`}
                rows={2}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-gray-400">{(s[key] || '').length}/160 chars</span>
                {(s[key] || '').length > 160 && (
                  <span className="text-[11px] text-amber-600 font-medium">⚠ Will use 2 SMS credits</span>
                )}
              </div>
            </Field>
          ))}
        </div>

        <Divider label="Default Templates" />
        <InfoBox>
          Leave a template blank to use the system default. Variables in curly braces are replaced with real values when SMS is sent.
        </InfoBox>
        <button onClick={() => {
          SMS_TEMPLATES.forEach(({ key }) => set(key, ''));
          toast.success('Templates reset to defaults');
        }} className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline">
          Reset all to defaults
        </button>
      </Section>

      {/* Rate Limiting */}
      <Section title="Rate Limiting & Opt-out" description="Protect your SMS credits and comply with regulations">
        <Grid2>
          <Field label="Max SMS per Order" hint="Maximum SMS per customer per order">
            <Input value={s.sms_max_per_order || '3'} onChange={v => set('sms_max_per_order', v)} placeholder="3" />
          </Field>
          <Field label="Opt-out Keyword" hint="Customers reply this to unsubscribe">
            <Input value={s.sms_optout_keyword || 'STOP'} onChange={v => set('sms_optout_keyword', v)} placeholder="STOP" monospace />
          </Field>
        </Grid2>
        <Toggle value={s.sms_respect_optout || 'true'} onChange={v => set('sms_respect_optout', v)}
          label="Respect Opt-out List" description="Never send SMS to customers who replied STOP" />
      </Section>
    </PageShell>
  );
}
