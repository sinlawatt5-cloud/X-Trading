'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/use-settings';
import { t, type Locale } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';
import { useTheme } from 'next-themes';

type SettingsForm = {
  llmProvider: string;
  llmApiKey: string;
  marketDataProvider: string;
  marketDataApiKey: string;
  language: Locale;
  theme: 'light' | 'dark';
  cronEnabled: boolean;
  cronInterval: string;
  minConfidence: string;
};

function toForm(settings: ReturnType<typeof useSettings>['settings']): SettingsForm {
  return {
    llmProvider: settings.llmProvider ?? 'anthropic',
    llmApiKey: settings.llmApiKey ?? '',
    marketDataProvider: settings.marketDataProvider ?? 'twelvedata',
    marketDataApiKey: settings.marketDataApiKey ?? '',
    language: settings.language ?? 'th',
    theme: settings.theme === 'dark' ? 'dark' : 'light',
    cronEnabled: Boolean(settings.cronEnabled),
    cronInterval: String(settings.cronInterval ?? 15),
    minConfidence: String(settings.minConfidence ?? 70),
  };
}

function SettingsFormView({
  initialSettings,
}: {
  initialSettings: ReturnType<typeof useSettings>['settings'];
}) {
  const [form, setForm] = useState<SettingsForm>(() => toForm(initialSettings));
  const { updateSettings, saving } = useSettings();
  const { locale, setLocale } = useLocale();
  const { setTheme } = useTheme();

  const updateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cronInterval = Number(form.cronInterval);
    const minConfidence = Number(form.minConfidence);

    if (!Number.isFinite(cronInterval) || !Number.isFinite(minConfidence)) {
      toast.error(t('settings.saveError', locale));
      return;
    }

    const ok = await updateSettings({
      llmProvider: form.llmProvider,
      llmApiKey: form.llmApiKey.trim() || null,
      marketDataProvider: form.marketDataProvider,
      marketDataApiKey: form.marketDataApiKey.trim() || null,
      language: form.language,
      theme: form.theme,
      cronEnabled: form.cronEnabled,
      cronInterval,
      minConfidence,
    });

    if (ok) {
      setTheme(form.theme);
      setLocale(form.language);
      toast.success(t('settings.saveSuccess', locale));
    } else {
      toast.error(t('settings.saveError', locale));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="clay-card space-y-4 p-6">
        <h2 className="font-display text-xl font-bold text-gold-dark dark:text-gold-bright">
          {t('settings.general', locale)}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language', locale)}</Label>
            <select
              id="language"
              value={form.language}
              onChange={(event) => updateField('language', event.target.value as Locale)}
              className="clay-card h-10 w-full rounded-xl border-none px-3 py-2 font-body text-sm text-cream-dark dark:text-cream"
            >
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
            <p className="text-xs text-cream-dark/60 dark:text-cream/60">
              {t('settings.languageDescription', locale)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">{t('settings.theme', locale)}</Label>
            <select
              id="theme"
              value={form.theme}
              onChange={(event) => updateField('theme', event.target.value as 'light' | 'dark')}
              className="clay-card h-10 w-full rounded-xl border-none px-3 py-2 font-body text-sm text-cream-dark dark:text-cream"
            >
              <option value="light">{t('settings.themeLight', locale)}</option>
              <option value="dark">{t('settings.themeDark', locale)}</option>
            </select>
            <p className="text-xs text-cream-dark/60 dark:text-cream/60">
              {t('settings.themeDescription', locale)}
            </p>
          </div>
        </div>
      </section>

      <section className="clay-card space-y-4 p-6">
        <h2 className="font-display text-xl font-bold text-gold-dark dark:text-gold-bright">
          {t('settings.providers', locale)}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="llmProvider">{t('settings.llmProvider', locale)}</Label>
            <select
              id="llmProvider"
              value={form.llmProvider}
              onChange={(event) => updateField('llmProvider', event.target.value)}
              className="clay-card h-10 w-full rounded-xl border-none px-3 py-2 font-body text-sm text-cream-dark dark:text-cream"
            >
              <option value="anthropic">{t('settings.llmProviderAnthropic', locale)}</option>
              <option value="openai">{t('settings.llmProviderOpenAI', locale)}</option>
              <option value="openrouter">{t('settings.llmProviderOpenRouter', locale)}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="llmApiKey">{t('settings.llmApiKey', locale)}</Label>
            <Input
              id="llmApiKey"
              type="password"
              value={form.llmApiKey}
              onChange={(event) => updateField('llmApiKey', event.target.value)}
              placeholder="sk-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketDataProvider">{t('settings.marketDataProvider', locale)}</Label>
            <select
              id="marketDataProvider"
              value={form.marketDataProvider}
              onChange={(event) => updateField('marketDataProvider', event.target.value)}
              className="clay-card h-10 w-full rounded-xl border-none px-3 py-2 font-body text-sm text-cream-dark dark:text-cream"
            >
              <option value="twelvedata">{t('settings.marketProviderTwelveData', locale)}</option>
              <option value="alphavantage">{t('settings.marketProviderAlphaVantage', locale)}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketDataApiKey">{t('settings.marketDataApiKey', locale)}</Label>
            <Input
              id="marketDataApiKey"
              type="password"
              value={form.marketDataApiKey}
              onChange={(event) => updateField('marketDataApiKey', event.target.value)}
              placeholder="key-..."
            />
          </div>
        </div>

        <p className="text-xs text-cream-dark/60 dark:text-cream/60">
          {t('settings.apiProtectedNote', locale)}
        </p>
      </section>

      <section className="clay-card space-y-4 p-6">
        <h2 className="font-display text-xl font-bold text-gold-dark dark:text-gold-bright">
          {t('settings.analysis', locale)}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cronEnabled">{t('settings.cronEnabled', locale)}</Label>
            <div className="flex items-center gap-3">
              <Switch
                id="cronEnabled"
                checked={form.cronEnabled}
                onCheckedChange={(checked) => updateField('cronEnabled', Boolean(checked))}
              />
              <span className="font-body text-sm text-cream-dark/70 dark:text-cream/70">
                {t('settings.cronDescription', locale)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cronInterval">{t('settings.cronInterval', locale)}</Label>
            <Input
              id="cronInterval"
              type="number"
              min="1"
              step="1"
              value={form.cronInterval}
              onChange={(event) => updateField('cronInterval', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minConfidence">{t('settings.minConfidence', locale)}</Label>
            <Input
              id="minConfidence"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.minConfidence}
              onChange={(event) => updateField('minConfidence', event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={saving} className="px-6">
          {saving ? t('common.loading', locale) : t('settings.save', locale)}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { settings } = useSettings();
  const { locale } = useLocale();
  const formKey = [
    settings.llmProvider,
    settings.llmApiKey ?? '',
    settings.marketDataProvider,
    settings.marketDataApiKey ?? '',
    settings.language,
    settings.theme,
    String(settings.cronEnabled),
    String(settings.cronInterval),
    String(settings.minConfidence),
  ].join('|');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cream-dark dark:text-cream">
          {t('settings.title', locale)}
        </h1>
        <p className="mt-2 font-handwritten text-sm text-cream-dark/70 dark:text-cream/70">
          {t('settings.languageRestart', locale)}
        </p>
      </div>

      <SettingsFormView key={formKey} initialSettings={settings} />
    </div>
  );
}
