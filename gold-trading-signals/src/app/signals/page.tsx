'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AnalysisPanel } from '@/components/analysis-panel';
import { SignalCard } from '@/components/signal-card';
import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';

interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  timeframe: string;
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  confluence: string;
  reasoning: string;
  analysis: string;
  status: string;
  createdAt: string;
}

interface Indicators {
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
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { locale } = useLocale();

  const { data: indicatorSnapshot } = useSWR<Indicators>('/api/indicators', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    fetch('/api/signals?limit=100')
      .then((res) => res.json())
      .then((data) => {
        setSignals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return signals.filter((signal) => {
      const matchesType = typeFilter === 'all' || signal.type === typeFilter.toUpperCase();
      const matchesStatus = statusFilter === 'all' || signal.status === statusFilter.toUpperCase();
      return matchesType && matchesStatus;
    });
  }, [signals, statusFilter, typeFilter]);

  const totalSignals = signals.length;
  const closedSignals = signals.filter((signal) => ['HIT_TP', 'HIT_SL', 'CLOSED'].includes(signal.status));
  const wins = closedSignals.filter((signal) => signal.status === 'HIT_TP').length;
  const winRate = closedSignals.length > 0 ? ((wins / closedSignals.length) * 100).toFixed(1) : '--';
  const avgConfidence =
    totalSignals > 0
      ? (signals.reduce((sum, signal) => sum + signal.confidence, 0) / totalSignals).toFixed(0)
      : '--';

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-cream-dark dark:text-cream">
          {t('signal.history', locale)}
        </h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="clay-card rounded-xl border-none px-4 py-2 font-body text-sm text-cream-dark dark:text-cream"
          >
            <option value="all">{t('signal.all', locale)}</option>
            <option value="buy">{t('signal.buySignal', locale)}</option>
            <option value="sell">{t('signal.sellSignal', locale)}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="clay-card rounded-xl border-none px-4 py-2 font-body text-sm text-cream-dark dark:text-cream"
          >
            <option value="all">{t('signal.all', locale)}</option>
            <option value="active">{t('signal.active', locale)}</option>
            <option value="closed">{t('signal.closed', locale)}</option>
            <option value="cancelled">{t('signal.cancelled', locale)}</option>
          </select>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">{totalSignals}</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">
            {t('signal.totalSignals', locale)}
          </div>
        </div>
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">{winRate}%</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">
            {t('signal.winRate', locale)}
          </div>
        </div>
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">{avgConfidence}</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">Avg Confidence</div>
        </div>
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">XAU/USD</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">
            {t('signal.activePair', locale)}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <AnalysisPanel />
      </div>

      {indicatorSnapshot && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="clay-card rounded-2xl p-6">
            <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">RSI</div>
            <div className="font-data text-2xl font-bold text-honey dark:text-bright-gold">
              {indicatorSnapshot.indicators.rsi.toFixed(1)}
            </div>
          </div>
          <div className="clay-card rounded-2xl p-6">
            <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">MACD Histogram</div>
            <div className="font-data text-2xl font-bold text-honey dark:text-bright-gold">
              {indicatorSnapshot.indicators.macd.histogram.toFixed(3)}
            </div>
          </div>
          <div className="clay-card rounded-2xl p-6">
            <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">Last Price</div>
            <div className="font-data text-2xl font-bold text-honey dark:text-bright-gold">
              ${indicatorSnapshot.indicators.lastPrice.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center font-body text-cream-dark/50 dark:text-cream/50">
          {t('common.loading', locale)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center font-body text-cream-dark/50 dark:text-cream/50">
          {t('common.noData', locale)}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}
