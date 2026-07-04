'use client';

import { CreditCard } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  PageShell, Section, Grid2, Field, Input, SecretInput,
  Select, Toggle, StatusChip, InfoBox, Divider, SettingsSkeleton,
} from '@/components/admin/settings/SettingsUI';

export default function PaymentSettingsClient() {
  const { settings: s, loading, saving, dirty, set, save } = useSettings('payment');

  if (loading) return <SettingsSkeleton />;

  return (
    <PageShell
      title="Payment Settings"
      description="Configure payment gateways — SSLCommerz, bKash, Nagad, and COD"
      icon={<CreditCard className="w-5 h-5" />}
      dirty={dirty}
      saving={saving}
      onSave={save}
    >
      <InfoBox>
        API keys and secrets are encrypted before storage. Use sandbox credentials during development, switch to live before going to production.
      </InfoBox>

      {/* COD */}
      <Section title="Cash on Delivery" description="Simplest payment method — no gateway required">
        <Toggle value={s.cod_enabled || 'true'} onChange={v => set('cod_enabled', v)}
          label="Enable Cash on Delivery" description="Allow customers to pay on delivery" />
        <Grid2>
          <Field label="COD Fee (৳)" hint="Extra charge for COD orders. Set 0 for free.">
            <Input value={s.cod_fee || '0'} onChange={v => set('cod_fee', v)} placeholder="0" />
          </Field>
          <Field label="COD Available Up To (৳)" hint="Max order value for COD. Set 0 for unlimited.">
            <Input value={s.cod_max_amount || '0'} onChange={v => set('cod_max_amount', v)} placeholder="0" />
          </Field>
        </Grid2>
      </Section>

      {/* SSLCommerz */}
      <Section title="SSLCommerz" description="Credit/Debit card, internet banking, mobile banking"
        badge={s.sslcommerz_store_id ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.sslcommerz_store_id && s.sslcommerz_store_pass)} />
          <Toggle value={s.sslcommerz_enabled || 'false'} onChange={v => set('sslcommerz_enabled', v)}
            label="Enable SSLCommerz" description="" />
        </div>
        <Grid2>
          <Field label="Environment">
            <Select value={s.sslcommerz_env || 'sandbox'} onChange={v => set('sslcommerz_env', v)}
              options={[{ value: 'sandbox', label: '🧪 Sandbox (Testing)' }, { value: 'live', label: '🚀 Live (Production)' }]} />
          </Field>
          <Field label="Store ID" required
            docUrl="https://developer.sslcommerz.com/doc/v4">
            <Input value={s.sslcommerz_store_id || ''} onChange={v => set('sslcommerz_store_id', v)} placeholder="testbox" monospace />
          </Field>
          <Field label="Store Password / Secret" required>
            <SecretInput value={s.sslcommerz_store_pass || ''} onChange={v => set('sslcommerz_store_pass', v)} placeholder="testbox@ssl" />
          </Field>
          <Field label="Success Redirect URL" hint="Auto-filled from store URL if blank">
            <Input value={s.sslcommerz_success_url || ''} onChange={v => set('sslcommerz_success_url', v)} placeholder="/api/payments/ssl/success" />
          </Field>
        </Grid2>
      </Section>

      {/* bKash */}
      <Section title="bKash" description="Mobile payment — most popular in Bangladesh"
        badge={s.bkash_app_key ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.bkash_app_key && s.bkash_app_secret)} />
          <Toggle value={s.bkash_enabled || 'false'} onChange={v => set('bkash_enabled', v)}
            label="Enable bKash" description="" />
        </div>
        <Grid2>
          <Field label="Environment">
            <Select value={s.bkash_env || 'sandbox'} onChange={v => set('bkash_env', v)}
              options={[{ value: 'sandbox', label: '🧪 Sandbox' }, { value: 'live', label: '🚀 Live' }]} />
          </Field>
          <Field label="Base URL">
            <Input value={s.bkash_base_url || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'} onChange={v => set('bkash_base_url', v)} monospace />
          </Field>
          <Field label="App Key" required docUrl="https://developer.bka.sh/docs">
            <Input value={s.bkash_app_key || ''} onChange={v => set('bkash_app_key', v)} placeholder="bKash App Key" monospace />
          </Field>
          <Field label="App Secret" required>
            <SecretInput value={s.bkash_app_secret || ''} onChange={v => set('bkash_app_secret', v)} placeholder="App Secret" />
          </Field>
          <Field label="Username" required>
            <Input value={s.bkash_username || ''} onChange={v => set('bkash_username', v)} placeholder="bKash username" monospace />
          </Field>
          <Field label="Password" required>
            <SecretInput value={s.bkash_password || ''} onChange={v => set('bkash_password', v)} placeholder="bKash password" />
          </Field>
        </Grid2>
      </Section>

      {/* Nagad */}
      <Section title="Nagad" description="Bangladesh Post Office mobile banking"
        badge={s.nagad_merchant_id ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.nagad_merchant_id && s.nagad_merchant_key)} />
          <Toggle value={s.nagad_enabled || 'false'} onChange={v => set('nagad_enabled', v)}
            label="Enable Nagad" description="" />
        </div>
        <Grid2>
          <Field label="Environment">
            <Select value={s.nagad_env || 'sandbox'} onChange={v => set('nagad_env', v)}
              options={[{ value: 'sandbox', label: '🧪 Sandbox' }, { value: 'live', label: '🚀 Live' }]} />
          </Field>
          <Field label="Merchant ID" required docUrl="https://nagad.com.bd/merchant">
            <Input value={s.nagad_merchant_id || ''} onChange={v => set('nagad_merchant_id', v)} placeholder="Merchant ID" monospace />
          </Field>
          <Field label="Merchant Key" required>
            <SecretInput value={s.nagad_merchant_key || ''} onChange={v => set('nagad_merchant_key', v)} placeholder="Merchant Key" />
          </Field>
          <Field label="Public Key">
            <Input value={s.nagad_public_key || ''} onChange={v => set('nagad_public_key', v)} placeholder="Public Key" monospace />
          </Field>
        </Grid2>
      </Section>

      {/* Refund Settings */}
      <Section title="Refund Policy" description="How automatic refunds are handled">
        <Grid2>
          <Field label="Auto Refund on Cancel">
            <Select value={s.auto_refund_on_cancel || 'false'} onChange={v => set('auto_refund_on_cancel', v)}
              options={[{ value: 'true', label: 'Yes — Auto refund on cancellation' }, { value: 'false', label: 'No — Manual refund only' }]} />
          </Field>
          <Field label="Refund Window (days)" hint="Days after delivery to allow returns">
            <Input value={s.refund_window_days || '7'} onChange={v => set('refund_window_days', v)} placeholder="7" />
          </Field>
        </Grid2>
      </Section>
    </PageShell>
  );
}
