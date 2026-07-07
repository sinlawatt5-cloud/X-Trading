'use client';

export default function NewsPage() {

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display mb-8 text-3xl font-bold text-cream-dark dark:text-cream">
        News & Calendar
      </h1>
      <div className="clay-card rounded-2xl p-8">
        <h2 className="font-display mb-4 text-xl font-bold text-honey dark:text-bright-gold">
          📅 Economic Calendar
        </h2>
        <p className="font-body text-cream-dark/70 dark:text-cream/70">
          Coming in Phase 4 — Economic Calendar with event notifications.
        </p>
      </div>
    </div>
  );
}
