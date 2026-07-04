'use client';

import { Megaphone } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import {
  PageShell, Section, Grid2, Field, Input, SecretInput,
  Toggle, StatusChip, InfoBox, Divider, SettingsSkeleton,
} from '@/components/admin/settings/SettingsUI';

export default function MarketingSettingsClient() {
  const { settings: s, loading, saving, dirty, set, save } = useSettings('marketing');

  if (loading) return <SettingsSkeleton />;

  return (
    <PageShell
      title="Marketing Tools"
      description="Pixel IDs, Conversion APIs and analytics integrations for ad platforms"
      icon={<Megaphone className="w-5 h-5" />}
      dirty={dirty}
      saving={saving}
      onSave={save}
    >
      <InfoBox>
        Both browser-side pixels (via {'<Pixels />'} component) and server-side Conversions APIs are supported. Server-side events are more reliable and bypass ad blockers.
      </InfoBox>

      {/* Meta — Facebook & Instagram */}
      <Section title="Meta (Facebook & Instagram)" description="Pixel for browser events + Conversions API for server-side"
        badge={s.meta_pixel_id ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.meta_pixel_id && s.meta_access_token)} />
          <Toggle value={s.meta_enabled || 'false'} onChange={v => set('meta_enabled', v)} label="Enable Meta Tracking" description="" />
        </div>
        <Grid2>
          <Field label="Pixel ID (Public)" required
            docUrl="https://developers.facebook.com/docs/meta-pixel"
            hint="Goes in NEXT_PUBLIC_META_PIXEL_ID env var">
            <Input value={s.meta_pixel_id || ''} onChange={v => set('meta_pixel_id', v)} placeholder="1234567890" monospace />
          </Field>
          <Field label="Meta Access Token (Server)" required
            docUrl="https://developers.facebook.com/docs/marketing-api/conversions-api"
            hint="System User Token from Meta Business Suite">
            <SecretInput value={s.meta_access_token || ''} onChange={v => set('meta_access_token', v)} placeholder="EAAxxxx…" />
          </Field>
          <Field label="Ad Account ID" hint="Used for campaign budget reporting">
            <Input value={s.meta_ad_account_id || ''} onChange={v => set('meta_ad_account_id', v)} placeholder="act_1234567890" monospace />
          </Field>
          <Field label="Test Event Code" hint="Only for sandbox testing — remove in production">
            <Input value={s.meta_test_event_code || ''} onChange={v => set('meta_test_event_code', v)} placeholder="TEST12345" monospace />
          </Field>
        </Grid2>
        <Divider />
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Events to Send</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { key: 'meta_event_purchase', label: 'Purchase' },
              { key: 'meta_event_add_to_cart', label: 'Add to Cart' },
              { key: 'meta_event_checkout', label: 'Initiate Checkout' },
              { key: 'meta_event_view_content', label: 'View Content' },
              { key: 'meta_event_search', label: 'Search' },
              { key: 'meta_event_signup', label: 'Complete Registration' },
            ].map(({ key, label }) => (
              <Toggle key={key} value={s[key] || 'true'} onChange={v => set(key, v)} label={label} />
            ))}
          </div>
        </div>
      </Section>

      {/* TikTok */}
      <Section title="TikTok Ads" description="TikTok Pixel + Events API for short-video conversions"
        badge={s.tiktok_pixel_id ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.tiktok_pixel_id && s.tiktok_access_token)} />
          <Toggle value={s.tiktok_enabled || 'false'} onChange={v => set('tiktok_enabled', v)} label="Enable TikTok Tracking" description="" />
        </div>
        <Grid2>
          <Field label="Pixel ID (Public)" required
            docUrl="https://ads.tiktok.com/help/article/tiktok-pixel"
            hint="From TikTok Ads Manager → Assets → Events">
            <Input value={s.tiktok_pixel_id || ''} onChange={v => set('tiktok_pixel_id', v)} placeholder="C1234567890" monospace />
          </Field>
          <Field label="Events API Access Token" required
            docUrl="https://business-api.tiktok.com/portal/docs"
            hint="From TikTok Ads Manager → Assets → Events → API">
            <SecretInput value={s.tiktok_access_token || ''} onChange={v => set('tiktok_access_token', v)} placeholder="TikTok Access Token" />
          </Field>
          <Field label="Test Event Code" hint="For sandbox testing only">
            <Input value={s.tiktok_test_event_code || ''} onChange={v => set('tiktok_test_event_code', v)} placeholder="TEST12345" monospace />
          </Field>
        </Grid2>
      </Section>

      {/* Google Analytics 4 */}
      <Section title="Google Analytics 4" description="GA4 Measurement Protocol for server-side events"
        badge={s.ga4_measurement_id ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!(s.ga4_measurement_id && s.ga4_api_secret)} />
          <Toggle value={s.ga4_enabled || 'false'} onChange={v => set('ga4_enabled', v)} label="Enable GA4 Tracking" description="" />
        </div>
        <Grid2>
          <Field label="Measurement ID (Public)" required
            docUrl="https://developers.google.com/analytics/devguides/collection/protocol/ga4"
            hint="Starts with G- from Analytics Admin → Data Streams">
            <Input value={s.ga4_measurement_id || ''} onChange={v => set('ga4_measurement_id', v)} placeholder="G-XXXXXXXXXX" monospace />
          </Field>
          <Field label="API Secret (Server)" required
            hint="Admin → Data Streams → Measurement Protocol API secrets">
            <SecretInput value={s.ga4_api_secret || ''} onChange={v => set('ga4_api_secret', v)} placeholder="API Secret" />
          </Field>
        </Grid2>
      </Section>

      {/* Google Ads */}
      <Section title="Google Ads" description="Conversion tracking for Google Search and Shopping ads"
        badge={s.google_ads_conversion_id ? 'Connected' : undefined}>
        <div className="flex items-center justify-between mb-4">
          <StatusChip connected={!!s.google_ads_conversion_id} />
          <Toggle value={s.google_ads_enabled || 'false'} onChange={v => set('google_ads_enabled', v)} label="Enable Google Ads Tracking" description="" />
        </div>
        <Grid2>
          <Field label="Conversion ID" docUrl="https://support.google.com/google-ads/answer/1722054">
            <Input value={s.google_ads_conversion_id || ''} onChange={v => set('google_ads_conversion_id', v)} placeholder="AW-123456789" monospace />
          </Field>
          <Field label="Conversion Label">
            <Input value={s.google_ads_conversion_label || ''} onChange={v => set('google_ads_conversion_label', v)} placeholder="xxXxXxXx" monospace />
          </Field>
        </Grid2>
      </Section>

      {/* UTM Defaults */}
      <Section title="UTM Defaults" description="Default UTM parameters auto-appended to your share links">
        <Grid2>
          <Field label="Default UTM Source">
            <Input value={s.utm_default_source || ''} onChange={v => set('utm_default_source', v)} placeholder="facebook" />
          </Field>
          <Field label="Default UTM Medium">
            <Input value={s.utm_default_medium || ''} onChange={v => set('utm_default_medium', v)} placeholder="social" />
          </Field>
        </Grid2>
        <Toggle value={s.utm_auto_capture || 'true'} onChange={v => set('utm_auto_capture', v)}
          label="Auto-capture UTM on page load" description="Saves UTM params to sessionStorage automatically" />
      </Section>

      {/* Attribution */}
      <Section title="Attribution Model" description="How credit is assigned when a customer touches multiple channels">
        <Grid2>
          <Field label="Attribution Model" hint="How to assign revenue to channels">
            <select value={s.attribution_model || 'last_touch'} onChange={e => set('attribution_model', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
              <option value="last_touch">Last Touch (default)</option>
              <option value="first_touch">First Touch</option>
              <option value="linear">Linear (equal credit)</option>
            </select>
          </Field>
          <Field label="Attribution Window (days)" hint="How many days back to look for touchpoints">
            <Input value={s.attribution_window || '7'} onChange={v => set('attribution_window', v)} placeholder="7" />
          </Field>
        </Grid2>
      </Section>
    </PageShell>
  );
}
