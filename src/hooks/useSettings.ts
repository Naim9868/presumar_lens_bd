// src/hooks/useSettings.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useSettings(group: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/settings?group=${group}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to load settings (${res.status})`);
      }
      if (data.success && data.settings) {
        setSettings(data.settings);
        setDirty(false);
      }
    } catch (error) {
      console.error('[useSettings.load]', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => { load(); }, [load]);

  const set = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, settings }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Settings saved');
        setDirty(false);
        await load(); // reload to get masked values
      } else {
        toast.error(data.error || `Failed to save settings (${res.status})`);
      }
    } catch (error) {
      console.error('[useSettings.save]', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, dirty, set, save, reload: load };
}
