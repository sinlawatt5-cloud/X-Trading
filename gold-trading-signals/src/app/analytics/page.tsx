'use client';

import useSWR from 'swr';
import { useLocale } from '@/components/locale-provider';
import { t } from '@/lib/i18n';

interface StatsData {
  totalSignals: number;
  buyCount: number;
  sellCount: number;
  neutralCount: number;
  avgConfidence: number;
  activeCount: number;
  signalsByDay: { date: string; count: number }[];
  confidenceDistribution: { range: string; label: string; count: number }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnalyticsPage() {
  const { locale } = useLocale();
  const { data, error, isLoading } = useSWR<StatsData>('/api/stats', fetcher, {
    refreshInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="clay-card p-8 text-center">
          <div className="font-display text-4xl mb-2">📊</div>
          <p className="font-handwritten text-lg text-muted-foreground">
            {t('common.loading', locale)}
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="clay-card p-8 text-center">
          <div className="font-display text-4xl mb-2">⚠️</div>
          <p className="font-handwritten text-lg text-destructive">
            {t('common.error', locale)}
          </p>
        </div>
      </div>
    );
  }

  const buyRatio =
    data.totalSignals > 0
      ? Math.round((data.buyCount / data.totalSignals) * 100)
      : 0;
  const sellRatio =
    data.totalSignals > 0
      ? Math.round((data.sellCount / data.totalSignals) * 100)
      : 0;

  const maxDayCount = Math.max(...data.signalsByDay.map((d) => d.count), 1);
  const maxConfCount = Math.max(
    ...data.confidenceDistribution.map((d) => d.count),
    1
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-gold-dark dark:text-gold-bright">
          {t('analytics.title', locale)}
        </h1>
        <p className="font-handwritten text-lg text-muted-foreground mt-1">
          {t('analytics.subtitle', locale)}
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        {/* Total Signals */}
        <div className="clay-card p-5 flex flex-col gap-1">
          <span className="font-handwritten text-sm text-muted-foreground">
            {t('analytics.totalSignals', locale)}
          </span>
          <span className="font-data text-3xl font-bold text-gold-dark dark:text-gold-bright">
            {data.totalSignals}
          </span>
          <span className="font-handwritten text-xs text-muted-foreground">
            {t('analytics.allTime', locale)}
          </span>
        </div>

        {/* Avg Confidence */}
        <div className="clay-card p-5 flex flex-col gap-1">
          <span className="font-handwritten text-sm text-muted-foreground">
            {t('analytics.avgConfidence', locale)}
          </span>
          <span className="font-data text-3xl font-bold text-gold-dark dark:text-gold-bright">
            {data.avgConfidence}%
          </span>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-dark dark:bg-gold-bright transition-all duration-700"
              style={{ width: `${data.avgConfidence}%` }}
            />
          </div>
        </div>

        {/* Active Signals */}
        <div className="clay-card p-5 flex flex-col gap-1">
          <span className="font-handwritten text-sm text-muted-foreground">
            {t('analytics.activeSignals', locale)}
          </span>
          <span className="font-data text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.activeCount}
          </span>
          <span className="font-handwritten text-xs text-muted-foreground">
            {t('analytics.activeNow', locale)}
          </span>
        </div>

        {/* Buy / Sell Ratio */}
        <div className="clay-card p-5 flex flex-col gap-1">
          <span className="font-handwritten text-sm text-muted-foreground">
            {t('analytics.buySellRatio', locale)}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-data text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {buyRatio}%
            </span>
            <span className="font-handwritten text-xs text-muted-foreground">/</span>
            <span className="font-data text-2xl font-bold text-red-500 dark:text-red-400">
              {sellRatio}%
            </span>
          </div>
          {/* Buy/Sell bar */}
          <div className="mt-1 h-1.5 w-full rounded-full bg-red-200 dark:bg-red-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-700"
              style={{ width: `${buyRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Signals per Day Bar Chart */}
        <div className="clay-card p-6">
          <h2 className="font-display text-xl font-semibold text-gold-dark dark:text-gold-bright mb-4">
            📅 {t('analytics.signalsPerDay', locale)}
          </h2>
          <div className="clay-card-inset p-4">
            <div className="flex items-end gap-2 h-40">
              {data.signalsByDay.map((day) => {
                const heightPct =
                  day.count === 0 ? 4 : Math.round((day.count / maxDayCount) * 100);
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center flex-1 gap-1 group"
                  >
                    <div className="relative flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-gold-dark dark:bg-gold-bright opacity-80 group-hover:opacity-100 transition-all duration-300 relative"
                        style={{ height: `${heightPct}%` }}
                        title={`${day.count} signals`}
                      >
                        {/* Count label on top */}
                        {day.count > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-data text-[10px] text-gold-dark dark:text-gold-bright opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-data text-[9px] text-muted-foreground text-center leading-tight">
                      {formatDateLabel(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Summary below chart */}
          <div className="flex justify-between mt-3">
            <span className="font-handwritten text-xs text-muted-foreground">
              {t('analytics.last7Days', locale)}
            </span>
            <span className="font-data text-xs text-gold-dark dark:text-gold-bright">
              {data.signalsByDay.reduce((sum, d) => sum + d.count, 0)}{' '}
              {t('analytics.signalsTotal', locale)}
            </span>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="clay-card p-6">
          <h2 className="font-display text-xl font-semibold text-gold-dark dark:text-gold-bright mb-4">
            🎯 {t('analytics.confidenceDist', locale)}
          </h2>
          <div className="clay-card-inset p-4 space-y-3">
            {data.confidenceDistribution.map((item) => {
              const widthPct =
                item.count === 0
                  ? 2
                  : Math.round((item.count / maxConfCount) * 100);
              const colors = [
                'bg-red-400 dark:bg-red-500',
                'bg-amber-400 dark:bg-amber-400',
                'bg-emerald-500 dark:bg-emerald-400',
                'bg-gold-dark dark:bg-gold-bright',
              ];
              const confIdx =
                item.range === '0-50'
                  ? 0
                  : item.range === '50-70'
                  ? 1
                  : item.range === '70-85'
                  ? 2
                  : 3;

              return (
                <div key={item.range} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <span className="font-data text-xs text-muted-foreground">
                      {item.range}%
                    </span>
                  </div>
                  <div className="flex-1 h-6 rounded-lg bg-muted overflow-hidden relative">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 ${colors[confIdx]}`}
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2">
                      <span className="font-handwritten text-xs text-foreground/70 mix-blend-multiply dark:mix-blend-screen">
                        {item.label}
                      </span>
                    </span>
                  </div>
                  <div className="w-8 text-right shrink-0">
                    <span className="font-data text-xs font-bold text-gold-dark dark:text-gold-bright">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signal type breakdown */}
          <div className="mt-4 flex gap-3 justify-center">
            <div className="clay-card-inset px-4 py-2 flex items-center gap-2">
              <span className="font-handwritten text-xs text-muted-foreground">
                {t('signal.buy', locale)}
              </span>
              <span className="font-data text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {data.buyCount}
              </span>
            </div>
            <div className="clay-card-inset px-4 py-2 flex items-center gap-2">
              <span className="font-handwritten text-xs text-muted-foreground">
                {t('signal.sell', locale)}
              </span>
              <span className="font-data text-sm font-bold text-red-500 dark:text-red-400">
                {data.sellCount}
              </span>
            </div>
            <div className="clay-card-inset px-4 py-2 flex items-center gap-2">
              <span className="font-handwritten text-xs text-muted-foreground">
                NEUTRAL
              </span>
              <span className="font-data text-sm font-bold text-muted-foreground">
                {data.neutralCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-center font-handwritten text-xs text-muted-foreground">
        {t('analytics.autoRefresh', locale)}
      </p>
    </main>
  );
}
