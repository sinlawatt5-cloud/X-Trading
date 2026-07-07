'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/use-settings';
import { getDefaultModelForProvider } from '@/lib/llm-providers';
import { t, type Locale } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';
import { useTheme } from 'next-themes';

type SettingsForm = {
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  marketDataProvider: string;
  marketDataApiKey: string;
  language: Locale;
  theme: 'light' | 'dark';
  cronEnabled: boolean;
  cronInterval: string;
  minConfidence: string;
};

type AvailableModel = {
  id: string;
  label: string;
};

function toForm(settings: ReturnType<typeof useSettings>['settings']): SettingsForm {
  return {
    llmProvider: settings.llmProvider ?? 'anthropic',
    llmApiKey: settings.llmApiKey ?? '',
    llmModel: settings.llmModel ?? getDefaultModelForProvider(settings.llmProvider ?? 'anthropic') ?? '',
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
  const [isLlmKeySet, setIsLlmKeySet] = useState(!!initialSettings.llmApiKey);
  const [isMarketKeySet, setIsMarketKeySet] = useState(!!initialSettings.marketDataApiKey);
  const [testingLlm, setTestingLlm] = useState(false);
  const [testingMarket, setTestingMarket] = useState(false);
  const [availableLlmModels, setAvailableLlmModels] = useState<AvailableModel[]>([]);
  const [llmVerified, setLlmVerified] = useState(false);
  const { updateSettings, saving } = useSettings();
  const { locale, setLocale } = useLocale();
  const { setTheme } = useTheme();

  const { data: yfStatus } = useSWR('/api/settings/yfinance-status', (url: string) => fetch(url).then(r => r.json()), { refreshInterval: 60000 });


  const updateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((current) => {
      if (key === 'llmApiKey') {
        setAvailableLlmModels([]);
        setLlmVerified(false);
        return {
          ...current,
          llmApiKey: value as SettingsForm['llmApiKey'],
          llmModel: '',
        };
      }

      return { ...current, [key]: value };
    });
  };

  const handleProviderChange = (provider: string) => {
    setAvailableLlmModels([]);
    setLlmVerified(false);
    setForm((current) => ({
      ...current,
      llmProvider: provider,
      llmModel: '',
    }));
  };

  const handleTestProvider = async (kind: 'llm' | 'market') => {
    try {
      if (kind === 'llm') {
        setTestingLlm(true);
      } else {
        setTestingMarket(true);
      }

      const payload =
        kind === 'llm'
          ? {
              kind,
              llmProvider: form.llmProvider,
              llmApiKey: form.llmApiKey.trim(),
              llmModel: form.llmModel.trim(),
            }
          : {
              kind,
              marketDataProvider: form.marketDataProvider,
              marketDataApiKey: form.marketDataApiKey.trim(),
            };

      const response = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as Record<string, unknown>;
      if (!response.ok || result.ok !== true) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Test failed');
      }

      if (kind === 'llm') {
        const models = Array.isArray(result.models)
          ? (result.models as Array<{ id?: unknown; label?: unknown }>)
              .filter((model) => typeof model.id === 'string' && model.id)
              .map((model) => ({
                id: String(model.id),
                label: typeof model.label === 'string' ? model.label : String(model.id),
              }))
          : [];

        setAvailableLlmModels(models);
        setLlmVerified(models.length > 0);
        setForm((current) => ({
          ...current,
          llmModel:
            models.find((model) => model.id === current.llmModel)?.id ??
            String(result.model ?? models[0]?.id ?? ''),
        }));

        toast.success(locale === 'th' ? 'ทดสอบ LLM ผ่าน' : 'LLM test passed', {
          description: `${String(result.provider)} / ${String(result.model)} / ${String(result.latencyMs)}ms / ${models.length} models`,
        });
        return;
      }

      toast.success(locale === 'th' ? 'ทดสอบข้อมูลตลาดผ่าน' : 'Market data test passed', {
        description: `${String(result.provider)} / ${String(result.symbol)} / ${Number(result.price).toFixed(2)}`,
      });
    } catch (error) {
      if (kind === 'llm') {
        setAvailableLlmModels([]);
        setLlmVerified(false);
      }

      toast.error(locale === 'th' ? 'ทดสอบไม่ผ่าน' : 'Test failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTestingLlm(false);
      setTestingMarket(false);
    }
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
      llmModel: form.llmModel.trim() || null,
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
              onChange={(event) => handleProviderChange(event.target.value)}
              className="clay-card h-10 w-full rounded-xl border-none px-3 py-2 font-body text-sm text-cream-dark dark:text-cream"
            >
              <option value="anthropic">{t('settings.llmProviderAnthropic', locale)}</option>
              <option value="openai">{t('settings.llmProviderOpenAI', locale)}</option>
              <option value="openrouter">{t('settings.llmProviderOpenRouter', locale)}</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="llmApiKey">{t('settings.llmApiKey', locale)}</Label>
            {isLlmKeySet ? (
              <div className="flex items-center gap-2">
                <div className="clay-card-inset flex h-10 w-full items-center px-3 py-2 text-sm text-green-600 dark:text-green-400 font-handwritten">
                  <span className="mr-2">✅</span> {locale === 'th' ? 'API Key ถูกบันทึกไว้แล้ว' : 'API Key is saved'}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="clay-btn text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setIsLlmKeySet(false);
                    updateField('llmApiKey', '');
                  }}
                >
                  {locale === 'th' ? 'ลบ/เปลี่ยน' : 'Clear'}
                </Button>
              </div>
            ) : (
              <Input
                id="llmApiKey"
                type="password"
                value={form.llmApiKey}
                onChange={(event) => updateField('llmApiKey', event.target.value)}
                placeholder="sk-..."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="llmModel">{locale === 'th' ? 'โมเดล LLM' : 'LLM Model'}</Label>
            <select
              id="llmModel"
              value={form.llmModel}
              onChange={(event) => updateField('llmModel', event.target.value)}
              disabled={!llmVerified || availableLlmModels.length === 0}
              className="clay-card h-10 w-full rounded-xl border-none px-3 py-2 font-body text-sm text-cream-dark dark:text-cream disabled:opacity-60"
            >
              {availableLlmModels.length > 0 ? (
                availableLlmModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))
              ) : (
                <option value="">
                  {locale === 'th' ? 'กดทดสอบ LLM ก่อนเพื่อโหลดโมเดล' : 'Run LLM test first to load models'}
                </option>
              )}
            </select>
            <p className="text-xs text-cream-dark/60 dark:text-cream/60">
              {locale === 'th'
                ? 'เปลี่ยน provider หรือ API key เมื่อไร ต้องกดทดสอบใหม่ก่อนถึงจะเลือกโมเดลได้'
                : 'Change provider or API key and test again before selecting a model.'}
            </p>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => handleTestProvider('llm')}
              disabled={testingLlm || !form.llmApiKey.trim()}
              className="w-full"
            >
              {testingLlm
                ? locale === 'th'
                  ? 'กำลังทดสอบ LLM...'
                  : 'Testing LLM...'
                : locale === 'th'
                  ? 'ทดสอบ LLM และโหลดโมเดล'
                  : 'Test LLM and load models'}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="marketDataProvider">{t('settings.marketDataProvider', locale)}</Label>
              <div className="flex items-center gap-2 text-xs font-handwritten">
                <span className="text-cream-dark/60 dark:text-cream/60">YFinance (Fallback):</span>
                {yfStatus?.status === 'online' ? (
                  <span className="flex items-center text-green-600 dark:text-green-400 font-bold"><span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>Online</span>
                ) : yfStatus?.status === 'offline' ? (
                  <span className="flex items-center text-red-600 dark:text-red-400 font-bold"><span className="mr-1 h-2 w-2 rounded-full bg-red-500"></span>Offline</span>
                ) : (
                  <span className="text-cream-dark/40 dark:text-cream/40">Checking...</span>
                )}
              </div>
            </div>
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
            {isMarketKeySet ? (
              <div className="flex items-center gap-2">
                <div className="clay-card-inset flex h-10 w-full items-center px-3 py-2 text-sm text-green-600 dark:text-green-400 font-handwritten">
                  <span className="mr-2">✅</span> {locale === 'th' ? 'API Key ถูกบันทึกไว้แล้ว' : 'API Key is saved'}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="clay-btn text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setIsMarketKeySet(false);
                    updateField('marketDataApiKey', '');
                  }}
                >
                  {locale === 'th' ? 'ลบ/เปลี่ยน' : 'Clear'}
                </Button>
              </div>
            ) : (
              <Input
                id="marketDataApiKey"
                type="password"
                value={form.marketDataApiKey}
                onChange={(event) => updateField('marketDataApiKey', event.target.value)}
                placeholder="key-..."
              />
            )}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleTestProvider('market')}
              disabled={testingMarket || !form.marketDataApiKey.trim()}
              className="px-6"
            >
              {testingMarket
                ? locale === 'th'
                  ? 'กำลังทดสอบข้อมูลตลาด...'
                  : 'Testing market data...'
                : locale === 'th'
                  ? 'ทดสอบข้อมูลตลาด'
                  : 'Test market data'}
            </Button>
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
    settings.llmModel ?? '',
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
