'use client';

export default function JournalPage() {

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display mb-8 text-3xl font-bold text-cream-dark dark:text-cream">
        Trading Journal
      </h1>
      <div className="clay-card rounded-2xl p-8">
        <h2 className="font-display mb-4 text-xl font-bold text-honey dark:text-bright-gold">
          📓 My Trades
        </h2>
        <p className="font-body text-cream-dark/70 dark:text-cream/70">
          Coming in Phase 4 — Track and analyze your trades.
        </p>
      </div>
    </div>
  );
}
