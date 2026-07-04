// src/components/admin/settings/SettingsUI.tsx
'use client';

import { useState } from 'react';
import { Save, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

// ─── Page shell ───────────────────────────────────────────
interface PageShellProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}

export function PageShell({ title, description, icon, dirty, saving, onSave, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              {icon}
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">{title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-8 max-w-4xl space-y-6">
        {children}
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────
interface SectionProps {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export function Section({ title, description, badge, children }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-800">{title}</h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6 space-y-5">
        {children}
      </div>
    </div>
  );
}

// ─── 2-col grid ───────────────────────────────────────────
export function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

export function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-4">{children}</div>;
}

// ─── Field label ──────────────────────────────────────────
interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  docUrl?: string;
  children: React.ReactNode;
  span?: boolean;
}

export function Field({ label, hint, required, docUrl, children, span }: FieldProps) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {label} {required && <span className="text-red-400 normal-case">*</span>}
        </label>
        {docUrl && (
          <a href={docUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-0.5 text-[11px] text-violet-500 hover:underline font-medium">
            Docs <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

// ─── Text input ───────────────────────────────────────────
interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  monospace?: boolean;
}

export function Input({ value, onChange, placeholder, disabled, monospace }: InputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-shadow bg-white disabled:bg-gray-50 disabled:text-gray-400 ${monospace ? 'font-mono' : ''}`}
    />
  );
}

// ─── Secret input (mask toggle) ───────────────────────────
export function SecretInput({ value, onChange, placeholder }: InputProps) {
  const [show, setShow] = useState(false);
  const isMasked = value === '••••••••';

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
        className="w-full pl-3.5 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
      />
      <button
        type="button"
        onClick={() => { if (isMasked) onChange(''); setShow(!show); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────
interface TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function Textarea({ value, onChange, placeholder, rows = 3 }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none bg-white"
    />
  );
}

// ─── Select ───────────────────────────────────────────────
interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function Select({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Toggle ───────────────────────────────────────────────
interface ToggleProps {
  value: string; // 'true' | 'false'
  onChange: (v: string) => void;
  label: string;
  description?: string;
}

export function Toggle({ value, onChange, label, description }: ToggleProps) {
  const isOn = value === 'true';
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(isOn ? 'false' : 'true')}
        className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? 'bg-violet-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// ─── Status chip (connected / not connected) ──────────────
export function StatusChip({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {label || (connected ? 'Connected' : 'Not configured')}
    </div>
  );
}

// ─── Info callout ─────────────────────────────────────────
export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
      <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-700 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Divider with label ───────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-gray-100" />
      {label && <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">{label}</span>}
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────
export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
