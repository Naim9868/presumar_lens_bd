'use client';

import { Key } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  PageShell, Section, Grid2, Field, Input, SecretInput,
  Select, StatusChip, InfoBox, Divider, SettingsSkeleton,
} from '@/components/admin/settings/SettingsUI';

export default function ApiSettingsClient() {
  const { settings: s, loading, saving, dirty, set, save } = useSettings('api');

  if (loading) return <SettingsSkeleton />;

  return (
    <PageShell
      title="API Settings"
      description="Courier provider credentials, tracking webhooks and third-party API keys"
      icon={<Key className="w-5 h-5" />}
      dirty={dirty}
      saving={saving}
      onSave={save}
    >
      <InfoBox>
        All secret keys are encrypted in the database. Webhook URLs are auto-built from your store URL — register them in each provider's dashboard.
      </InfoBox>

      {/* SteadFast */}
      <Section title="SteadFast Courier" description="Most popular courier in Bangladesh — easy API"
        badge={s.steadfast_api_key ? 'Connected' : undefined}>
        <StatusChip connected={!!(s.steadfast_api_key && s.steadfast_secret_key)} />
        <div className="mt-4">
          <Grid2>
            <Field label="API Key" required docUrl="https://portal.steadfast.com.bd/public/api/v1">
              <Input value={s.steadfast_api_key || ''} onChange={v => set('steadfast_api_key', v)} placeholder="SteadFast API Key" monospace />
            </Field>
            <Field label="Secret Key" required>
              <SecretInput value={s.steadfast_secret_key || ''} onChange={v => set('steadfast_secret_key', v)} placeholder="SteadFast Secret" />
            </Field>
          </Grid2>
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Webhook URL (register this in SteadFast portal)</p>
            <p className="font-mono text-xs text-gray-600 break-all">{`${s.store_url || 'https://mystore.com'}/api/shipments/webhook/steadfast`}</p>
          </div>
        </div>
      </Section>

      {/* Pathao */}
      <Section title="Pathao Courier" description="City-to-city and same-day delivery"
        badge={s.pathao_client_id ? 'Connected' : undefined}>
        <StatusChip connected={!!(s.pathao_client_id && s.pathao_client_secret)} />
        <div className="mt-4">
          <Grid2>
            <Field label="Client ID" required docUrl="https://merchant.pathao.com/aladdin/api/v1">
              <Input value={s.pathao_client_id || ''} onChange={v => set('pathao_client_id', v)} placeholder="Pathao Client ID" monospace />
            </Field>
            <Field label="Client Secret" required>
              <SecretInput value={s.pathao_client_secret || ''} onChange={v => set('pathao_client_secret', v)} placeholder="Client Secret" />
            </Field>
            <Field label="Merchant Username" required>
              <Input value={s.pathao_username || ''} onChange={v => set('pathao_username', v)} placeholder="merchant@email.com" monospace />
            </Field>
            <Field label="Merchant Password" required>
              <SecretInput value={s.pathao_password || ''} onChange={v => set('pathao_password', v)} placeholder="Password" />
            </Field>
            <Field label="Default Store ID" hint="Get from Pathao merchant portal">
              <Input value={s.pathao_store_id || ''} onChange={v => set('pathao_store_id', v)} placeholder="12345" monospace />
            </Field>
            <Field label="Environment">
              <Select value={s.pathao_env || 'sandbox'} onChange={v => set('pathao_env', v)}
                options={[{ value: 'sandbox', label: '🧪 Sandbox' }, { value: 'live', label: '🚀 Live' }]} />
            </Field>
          </Grid2>
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Webhook URL</p>
            <p className="font-mono text-xs text-gray-600 break-all">{`${s.store_url || 'https://mystore.com'}/api/shipments/webhook/pathao`}</p>
          </div>
        </div>
      </Section>

      {/* RedX */}
      <Section title="RedX Courier" description="E-commerce focused courier with merchant portal"
        badge={s.redx_access_token ? 'Connected' : undefined}>
        <StatusChip connected={!!s.redx_access_token} />
        <div className="mt-4">
          <Grid2>
            <Field label="Access Token" required docUrl="https://openapi.redx.com.bd">
              <SecretInput value={s.redx_access_token || ''} onChange={v => set('redx_access_token', v)} placeholder="RedX Access Token" />
            </Field>
            <Field label="Default Pickup Store ID">
              <Input value={s.redx_store_id || ''} onChange={v => set('redx_store_id', v)} placeholder="Store ID" monospace />
            </Field>
          </Grid2>
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Webhook URL</p>
            <p className="font-mono text-xs text-gray-600 break-all">{`${s.store_url || 'https://mystore.com'}/api/shipments/webhook/redx`}</p>
          </div>
        </div>
      </Section>

      {/* Paperfly */}
      <Section title="Paperfly Courier" description="Door-to-door delivery across Bangladesh"
        badge={s.paperfly_api_key ? 'Connected' : undefined}>
        <StatusChip connected={!!s.paperfly_api_key} />
        <div className="mt-4">
          <Grid2>
            <Field label="API Key" docUrl="https://paperfly.com.bd/api">
              <Input value={s.paperfly_api_key || ''} onChange={v => set('paperfly_api_key', v)} placeholder="Paperfly API Key" monospace />
            </Field>
            <Field label="API Secret">
              <SecretInput value={s.paperfly_api_secret || ''} onChange={v => set('paperfly_api_secret', v)} placeholder="API Secret" />
            </Field>
            <Field label="Merchant Code">
              <Input value={s.paperfly_merchant_code || ''} onChange={v => set('paperfly_merchant_code', v)} placeholder="MERCH001" monospace />
            </Field>
          </Grid2>
        </div>
      </Section>

      {/* App-wide API */}
      <Section title="App API Keys" description="Keys used for internal API authentication">
        <Grid2>
          <Field label="Admin Secret Key" hint="Used to authenticate admin API calls. Keep this private.">
            <Input value={s.admin_api_key || ''} onChange={v => set('admin_api_key', v)} placeholder="Generate a random 32-char key" monospace />
          </Field>
          <Field label="Storefront API Key" hint="Public key for your storefront app">
            <Input value={s.storefront_api_key || ''} onChange={v => set('storefront_api_key', v)} placeholder="Public API key" monospace />
          </Field>
          <Field label="Webhook Secret" hint="Used to verify incoming webhook payloads">
            <Input value={s.webhook_secret || ''} onChange={v => set('webhook_secret', v)} placeholder="webhook_secret_abc123" monospace />
          </Field>
        </Grid2>
      </Section>
    </PageShell>
  );
}
