'use client';

import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/locale-provider';
import { t } from '@/lib/i18n';

type AnalysisSnapshot = {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  confluence: number;
  reasoning: string;
  smc: {
    score: number;
    structure: {
      trend: 'BULLISH' | 'BEARISH' | 'RANGING';
      broken: boolean;
    };
  };
  wyckoff: {
    score: number;
    phase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN' | 'UNKNOWN';
    spring: boolean;
    upthrust: boolean;
    volumeConfirmation: boolean;
  };
  mta: {
    score: number;
    d1: { alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
    h4: { alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
    h1: { alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
    m15: { alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
  };
  indicatorScore: number;
  newsScore: number;
};

type IndicatorResponse = {
  indicators: {
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    sma20: number;
    sma50: number;
    sma200: number;
    bb: { upper: number; middle: number; lower: number };
    lastPrice: number;
  };
  source: string;
  pricesCount: number;
  analysis: AnalysisSnapshot;
  news?: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    headlines: Array<{
      id: string;
      title: string;
      source: string;
    }>;
  };
};

const fetcher = (url: string) => fetch(url).then((response) => response.json());

const labels = {
  en: {
    title: 'Expert Analysis',
    subtitle: 'SMC, Wyckoff, and multi-timeframe confluence',
    confluence: 'Confluence',
    signal: 'Signal',
    reasoning: 'Reasoning',
    source: 'Source',
    smc: 'SMC',
    wyckoff: 'Wyckoff',
    mta: 'MTA',
    indicators: 'Indicators',
    news: 'News',
    trend: 'Trend',
    phase: 'Phase',
    alignment: 'Alignment',
    dataPoints: 'candles',
  },
  th: {
    title: 'ภาพรวมการวิเคราะห์',
    subtitle: 'รวม SMC, Wyckoff และ Multi-Timeframe',
    confluence: 'ความสอดคล้อง',
    signal: 'สัญญาณ',
    reasoning: 'เหตุผล',
    source: 'แหล่งข้อมูล',
    smc: 'SMC',
    wyckoff: 'Wyckoff',
    mta: 'MTA',
    indicators: 'อินดิเคเตอร์',
    news: 'ข่าว',
    trend: 'เทรนด์',
    phase: 'เฟส',
    alignment: 'การจัดแนว',
    dataPoints: 'แท่ง',
  },
} as const;

export function AnalysisPanel({ className = '' }: { className?: string }) {
  const { locale } = useLocale();
  const { data, error, isLoading } = useSWR<IndicatorResponse>('/api/indicators', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const copy = labels[locale as keyof typeof labels] ?? labels.en;
  const analysis = data?.analysis;
  const score = analysis?.confluence ?? 0;
  const signal = analysis?.signal ?? 'NEUTRAL';
  const confidence = analysis?.confidence ?? 0;

  const signalStyles = {
    BUY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    SELL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    NEUTRAL: 'bg-muted text-muted-foreground',
  } as const;

  const scoreTone =
    score >= 75 ? 'text-green-600 dark:text-green-400' : score >= 60 ? 'text-gold-dark dark:text-gold-bright' : 'text-muted-foreground';

  const metricCards = analysis
    ? [
        {
          title: copy.smc,
          value: analysis.smc.score,
          detail: `${copy.trend}: ${analysis.smc.structure.trend}${analysis.smc.structure.broken ? ' - BOS' : ''}`,
        },
        {
          title: copy.wyckoff,
          value: analysis.wyckoff.score,
          detail: `${copy.phase}: ${analysis.wyckoff.phase}`,
        },
        {
          title: copy.mta,
          value: analysis.mta.score,
          detail: `${copy.alignment}: ${analysis.mta.h4.alignment} / ${analysis.mta.h1.alignment}`,
        },
        {
          title: copy.indicators,
          value: analysis.indicatorScore,
          detail: 'RSI + MACD + MA',
        },
        {
          title: copy.news,
          value: analysis.newsScore,
          detail: copy.source,
        },
      ]
    : [];

  const timeframeBadges = analysis
    ? [
        `D1 ${analysis.mta.d1.alignment}`,
        `H4 ${analysis.mta.h4.alignment}`,
        `H1 ${analysis.mta.h1.alignment}`,
        `M15 ${analysis.mta.m15.alignment}`,
      ]
    : [];

  return (
    <section className={cn('clay-card p-6', className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-cream-dark dark:text-cream">
            {copy.title}
          </h2>
          <p className="font-handwritten text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <Badge className={cn('font-data text-xs', signalStyles[signal])}>
              {signal}
            </Badge>
            <span className="font-handwritten text-xs text-muted-foreground">
              {data.pricesCount} {copy.dataPoints}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-border/60 bg-background/30 p-6 text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-handwritten text-sm text-muted-foreground">
            {locale === 'th' ? 'กำลังโหลดการวิเคราะห์...' : 'Loading analysis...'}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="font-handwritten text-sm text-red-600 dark:text-red-400">
            {locale === 'th' ? 'โหลดการวิเคราะห์ไม่สำเร็จ' : 'Failed to load expert analysis'}
          </p>
        </div>
      )}

      {!isLoading && !error && analysis && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="clay-card-inset p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-handwritten text-sm text-muted-foreground">
                  {copy.confluence}
                </span>
                <span className={cn('font-data text-2xl font-bold', scoreTone)}>
                  {score.toFixed(0)}%
                </span>
              </div>

              <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    score >= 75 ? 'bg-emerald-500' : score >= 60 ? 'gold-gradient' : 'bg-muted-foreground/40'
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-background/40 p-4">
                  <div className="font-handwritten text-xs text-muted-foreground">{copy.signal}</div>
                  <div className="font-data text-lg font-bold text-gold-dark dark:text-gold-bright">
                    {signal}
                  </div>
                </div>
                <div className="rounded-2xl bg-background/40 p-4">
                  <div className="font-handwritten text-xs text-muted-foreground">
                    {t('signal.confidence', locale)}
                  </div>
                  <div className="font-data text-lg font-bold text-gold-dark dark:text-gold-bright">
                    {confidence.toFixed(0)}%
                  </div>
                </div>
                <div className="rounded-2xl bg-background/40 p-4">
                  <div className="font-handwritten text-xs text-muted-foreground">{copy.source}</div>
                  <div className="font-data text-lg font-bold text-gold-dark dark:text-gold-bright">
                    {data.source}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-background/30 p-4">
                <div className="mb-1 font-handwritten text-xs text-muted-foreground">
                  {copy.reasoning}
                </div>
                <p className="font-handwritten text-sm leading-relaxed text-cream-dark dark:text-cream">
                  {analysis.reasoning}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {metricCards.map((metric) => (
                <div key={metric.title} className="clay-card-inset p-4">
                  <div className="font-handwritten text-xs text-muted-foreground">{metric.title}</div>
                  <div className="font-data text-2xl font-bold text-gold-dark dark:text-gold-bright">
                    {metric.value.toFixed(0)}%
                  </div>
                  <div className="font-handwritten text-xs text-muted-foreground">
                    {metric.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {timeframeBadges.map((badge) => (
              <span
                key={badge}
                className="clay-card-inset inline-flex items-center rounded-full px-3 py-1 font-handwritten text-xs text-cream-dark dark:text-cream"
              >
                {badge}
              </span>
            ))}
          </div>

          {data.news?.headlines?.[0] && (
            <div className="rounded-2xl bg-background/30 p-4">
              <div className="mb-2 font-handwritten text-xs text-muted-foreground">
                {locale === 'th' ? 'ข่าวล่าสุด' : 'Latest News'}
              </div>
              <div className="font-body text-sm text-cream-dark dark:text-cream">
                {data.news.headlines[0].title}
              </div>
              <div className="mt-1 font-handwritten text-xs text-muted-foreground">
                {data.news.headlines[0].source}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
