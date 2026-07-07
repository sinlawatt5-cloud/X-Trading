'use client';

import { useState, useEffect } from 'react';
import { SignalCard } from '@/components/signal-card';
import { t, type Locale } from '@/lib/i18n';

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

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const locale: Locale = 'en';

  useEffect(() => {
    fetch('/api/signals?limit=100')
      .then((res) => res.json())
      .then((data) => {
        setSignals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? signals : signals.filter((s) => s.type === filter.toUpperCase());

  const totalSignals = signals.length;
  const closedSignals = signals.filter((s) => s.status === 'HIT_TP' || s.status === 'HIT_SL');
  const wins = closedSignals.filter((s) => s.status === 'HIT_TP').length;
  const winRate = closedSignals.length > 0 ? ((wins / closedSignals.length) * 100).toFixed(1) : '--';

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-cream-dark dark:text-cream">
          {t('signal.history', locale)}
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="clay-card rounded-xl border-none px-4 py-2 font-body text-sm text-cream-dark dark:text-cream"
        >
          <option value="all">All</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">{totalSignals}</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">Total Signals</div>
        </div>
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">{winRate}%</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">Win Rate</div>
        </div>
        <div className="clay-card rounded-2xl p-6 text-center">
          <div className="font-data text-3xl font-bold text-honey dark:text-bright-gold">XAU/USD</div>
          <div className="font-body text-sm text-cream-dark/70 dark:text-cream/70">Active Pair</div>
        </div>
      </div>

      {/* Signal List */}
      {loading ? (
        <div className="py-12 text-center font-body text-cream-dark/50 dark:text-cream/50">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center font-body text-cream-dark/50 dark:text-cream/50">No signals found</div>
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
