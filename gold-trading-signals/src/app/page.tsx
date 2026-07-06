'use client';

import useSWR from 'swr';
import { t, type Locale } from '@/lib/i18n';
import { Chart } from '@/components/chart';
import { SignalCard } from '@/components/signal-card';
import { SignalGenerator } from '@/components/signal-generator';

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const locale: Locale = 'en';
  
  const { data: signals = [], error: signalsError, isLoading: signalsLoading, mutate: refetchSignals } = useSWR<Signal[]>(
    '/api/signals?limit=10',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const handleSignalGenerated = () => {
    refetchSignals();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="font-display mb-4 text-5xl font-bold text-cream-dark dark:text-cream sm:text-6xl">
          {t('app.name', locale)}
        </h1>
        <p className="font-handwritten text-xl text-cream-dark/70 dark:text-cream/70">
          {t('app.description', locale)}
        </p>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Section - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Chart className="h-full" />
        </div>

        {/* Signal Generator */}
        <div className="lg:col-span-1">
          <SignalGenerator 
            onSignalGenerated={handleSignalGenerated}
            className="h-full"
          />
        </div>
      </div>

      {/* Signals List */}
      <section className="mt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-cream-dark dark:text-cream">
            Recent Signals
          </h2>
          <button
            onClick={() => refetchSignals()}
            className="clay-btn px-4 py-2 font-handwritten text-sm text-cream-dark dark:text-cream"
          >
            Refresh
          </button>
        </div>

        {signalsLoading && (
          <div className="clay-card p-8 text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="font-handwritten text-sm text-muted-foreground">
              Loading signals...
            </p>
          </div>
        )}

        {signalsError && (
          <div className="clay-card p-8 text-center">
            <p className="font-handwritten text-sm text-destructive">
              Error loading signals
            </p>
          </div>
        )}

        {!signalsLoading && !signalsError && signals.length === 0 && (
          <div className="clay-card p-8 text-center">
            <p className="font-handwritten text-muted-foreground">
              No signals generated yet. Use the generator above to create your first signal!
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-8">
        <div className="clay-card p-6">
          <h3 className="font-display mb-4 text-xl font-bold text-cream-dark dark:text-cream">
            {t('nav.dashboard', locale)}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="clay-card-inset flex items-center justify-between p-4">
              <span className="font-handwritten text-cream-dark/70 dark:text-cream/70">
                {t('signal.active', locale)}
              </span>
              <span className="font-data text-2xl font-bold text-gold-dark dark:text-gold-bright">
                {signals?.filter(s => s.status === 'ACTIVE').length ?? 0}
              </span>
            </div>
            <div className="clay-card-inset flex items-center justify-between p-4">
              <span className="font-handwritten text-cream-dark/70 dark:text-cream/70">
                Buy Signals
              </span>
              <span className="font-data text-2xl font-bold text-green-600 dark:text-green-400">
                {signals?.filter(s => s.type === 'BUY').length ?? 0}
              </span>
            </div>
            <div className="clay-card-inset flex items-center justify-between p-4">
              <span className="font-handwritten text-cream-dark/70 dark:text-cream/70">
                Sell Signals
              </span>
              <span className="font-data text-2xl font-bold text-red-600 dark:text-red-400">
                {signals?.filter(s => s.type === 'SELL').length ?? 0}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
