'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { Locale } from '@/lib/i18n';
import { defaultLocale } from '@/lib/i18n';

export interface Settings {
  id: string;
  llmProvider: string;
  llmApiKey: string | null;
  llmModel: string | null;
  marketDataProvider: string;
  marketDataApiKey: string | null;
  language: Locale;
  theme: string;
  cronEnabled: boolean;
  cronInterval: number;
  minConfidence: number;
}

const defaultSettings: Settings = {
  id: 'default',
  llmProvider: 'anthropic',
  llmApiKey: null,
  llmModel: null,
  marketDataProvider: 'twelvedata',
  marketDataApiKey: null,
  language: defaultLocale,
  theme: 'light',
  cronEnabled: false,
  cronInterval: 15,
  minConfidence: 70,
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<Settings>(
    '/api/settings',
    fetcher,
    {
      fallbackData: defaultSettings,
      revalidateOnFocus: false,
    }
  );

  const [saving, setSaving] = useState(false);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      try {
        setSaving(true);
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          await mutate(updated, { revalidate: false });
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [mutate]
  );

  return {
    settings: data ?? defaultSettings,
    loading: isLoading,
    error,
    saving,
    updateSettings,
    refetch: () => mutate(),
  };
}
