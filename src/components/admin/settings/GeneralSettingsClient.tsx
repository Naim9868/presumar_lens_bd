'use client';

import { Settings2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { PageShell, Section, Grid2, Field, Input, Textarea, Select, Toggle, SettingsSkeleton } from '@/components/admin/settings/SettingsUI';

export default function GeneralSettingsClient() {
  const { settings: s, loading, saving, dirty, set, save } = useSettings('general');

  if (loading) return <SettingsSkeleton />;

  return (
    <PageShell
      title="General Settings"
      description="Store information, branding, currency and regional preferences"
      icon={<Settings2 className="w-5 h-5" />}
      dirty={dirty}
      saving={saving}
      onSave={save}
    >
      {/* Store Info */}
      <Section title="Store Information" description="Basic details shown to customers and on invoices">
        <Grid2>
          <Field label="Store Name" required>
            <Input value={s.store_name || ''} onChange={v => set('store_name', v)} placeholder="My Awesome Store" />
          </Field>
          <Field label="Store Email" required>
            <Input value={s.store_email || ''} onChange={v => set('store_email', v)} placeholder="hello@mystore.com" />
          </Field>
          <Field label="Store Phone" required>
            <Input value={s.store_phone || ''} onChange={v => set('store_phone', v)} placeholder="01700000000" />
          </Field>
          <Field label="Support Phone">
            <Input value={s.support_phone || ''} onChange={v => set('support_phone', v)} placeholder="01800000000" />
          </Field>
          <Field label="Website URL" required>
            <Input value={s.store_url || ''} onChange={v => set('store_url', v)} placeholder="https://mystore.com" />
          </Field>
          <Field label="Admin URL">
            <Input value={s.admin_url || ''} onChange={v => set('admin_url', v)} placeholder="https://mystore.com/admin" />
          </Field>
        </Grid2>
        <Field label="Store Description" hint="Used in emails and meta tags">
          <Textarea value={s.store_description || ''} onChange={v => set('store_description', v)} placeholder="Describe your store in 1–2 sentences…" rows={2} />
        </Field>
        <Grid2>
          <Field label="Logo URL">
            <Input value={s.store_logo || ''} onChange={v => set('store_logo', v)} placeholder="https://cdn.mystore.com/logo.png" />
          </Field>
          <Field label="Favicon URL">
            <Input value={s.store_favicon || ''} onChange={v => set('store_favicon', v)} placeholder="https://cdn.mystore.com/favicon.ico" />
          </Field>
        </Grid2>
      </Section>

      {/* Address */}
      <Section title="Store Address" description="Physical address used on invoices and shipping">
        <Grid2>
          <Field label="Address Line 1" required>
            <Input value={s.address_line1 || ''} onChange={v => set('address_line1', v)} placeholder="House 12, Road 5" />
          </Field>
          <Field label="Address Line 2">
            <Input value={s.address_line2 || ''} onChange={v => set('address_line2', v)} placeholder="Sector 7" />
          </Field>
          <Field label="Area / Thana">
            <Input value={s.address_area || ''} onChange={v => set('address_area', v)} placeholder="Uttara" />
          </Field>
          <Field label="City" required>
            <Input value={s.address_city || ''} onChange={v => set('address_city', v)} placeholder="Dhaka" />
          </Field>
          <Field label="Division">
            <Select value={s.address_division || ''} onChange={v => set('address_division', v)}
              options={[
                { value: '', label: 'Select division' },
                ...['Dhaka','Chittagong','Rajshahi','Khulna','Barisal','Sylhet','Rangpur','Mymensingh'].map(d => ({ value: d, label: d }))
              ]} />
          </Field>
          <Field label="Postcode">
            <Input value={s.address_postcode || ''} onChange={v => set('address_postcode', v)} placeholder="1230" />
          </Field>
        </Grid2>
      </Section>

      {/* Currency & Regional */}
      <Section title="Currency & Regional" description="Affects pricing display and checkout">
        <Grid2>
          <Field label="Currency" required>
            <Select value={s.currency || 'BDT'} onChange={v => set('currency', v)}
              options={[
                { value: 'BDT', label: 'BDT — Bangladeshi Taka (৳)' },
                { value: 'USD', label: 'USD — US Dollar ($)' },
              ]} />
          </Field>
          <Field label="Currency Symbol">
            <Input value={s.currency_symbol || '৳'} onChange={v => set('currency_symbol', v)} placeholder="৳" />
          </Field>
          <Field label="Timezone">
            <Select value={s.timezone || 'Asia/Dhaka'} onChange={v => set('timezone', v)}
              options={[
                { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
                { value: 'UTC', label: 'UTC' },
              ]} />
          </Field>
          <Field label="Language">
            <Select value={s.language || 'en'} onChange={v => set('language', v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'bn', label: 'বাংলা' },
              ]} />
          </Field>
          <Field label="Date Format">
            <Select value={s.date_format || 'DD MMM YYYY'} onChange={v => set('date_format', v)}
              options={[
                { value: 'DD MMM YYYY', label: '25 Jan 2025' },
                { value: 'DD/MM/YYYY', label: '25/01/2025' },
                { value: 'MM/DD/YYYY', label: '01/25/2025' },
              ]} />
          </Field>
          <Field label="Tax Rate (%)" hint="Applied to all orders if tax is enabled">
            <Input value={s.tax_rate || '0'} onChange={v => set('tax_rate', v)} placeholder="0" />
          </Field>
        </Grid2>
      </Section>

      {/* Delivery Charges */}
      <Section title="Delivery Charges" description="Default delivery fees per zone">
        <Grid2>
          <Field label="Inside Dhaka (৳)" required>
            <Input value={s.delivery_inside_dhaka || '60'} onChange={v => set('delivery_inside_dhaka', v)} placeholder="60" />
          </Field>
          <Field label="Outside Dhaka (৳)" required>
            <Input value={s.delivery_outside_dhaka || '120'} onChange={v => set('delivery_outside_dhaka', v)} placeholder="120" />
          </Field>
          <Field label="Free Shipping Above (৳)" hint="Set 0 to disable free shipping">
            <Input value={s.free_shipping_above || '0'} onChange={v => set('free_shipping_above', v)} placeholder="2000" />
          </Field>
          <Field label="Express Delivery (৳)">
            <Input value={s.delivery_express || ''} onChange={v => set('delivery_express', v)} placeholder="200" />
          </Field>
        </Grid2>
      </Section>

      {/* Social Media */}
      <Section title="Social Media Links" description="Used in footer and SEO">
        <Grid2>
          {[
            { key: 'social_facebook',  label: 'Facebook Page URL',   placeholder: 'https://facebook.com/mystore' },
            { key: 'social_instagram', label: 'Instagram URL',        placeholder: 'https://instagram.com/mystore' },
            { key: 'social_tiktok',    label: 'TikTok URL',           placeholder: 'https://tiktok.com/@mystore' },
            { key: 'social_youtube',   label: 'YouTube Channel',      placeholder: 'https://youtube.com/@mystore' },
            { key: 'social_whatsapp',  label: 'WhatsApp Number',      placeholder: '8801700000000' },
            { key: 'social_telegram',  label: 'Telegram Channel',     placeholder: 'https://t.me/mystore' },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <Input value={s[key] || ''} onChange={v => set(key, v)} placeholder={placeholder} />
            </Field>
          ))}
        </Grid2>
      </Section>

      {/* Feature Toggles */}
      <Section title="Feature Toggles" description="Enable or disable store features">
        <div className="space-y-3 divide-y divide-gray-50">
          {[
            { key: 'feature_guest_checkout', label: 'Guest Checkout', desc: 'Allow orders without account' },
            { key: 'feature_reviews', label: 'Product Reviews', desc: 'Let customers leave reviews' },
            { key: 'feature_wishlist', label: 'Wishlist', desc: 'Allow saving products to wishlist' },
            { key: 'feature_coupon', label: 'Coupon Codes', desc: 'Enable coupon / discount codes at checkout' },
            { key: 'feature_maintenance', label: 'Maintenance Mode', desc: 'Put the store in maintenance mode (admin can still access)' },
            { key: 'feature_cod', label: 'Cash on Delivery', desc: 'Allow COD payment method' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="pt-3 first:pt-0">
              <Toggle value={s[key] || 'true'} onChange={v => set(key, v)} label={label} description={desc} />
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
