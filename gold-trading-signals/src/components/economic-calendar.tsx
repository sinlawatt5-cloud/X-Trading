'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  type CalendarEvent,
  fetchEconomicCalendar,
  getImpactColor,
  getImportanceBadge,
  isUpcoming,
  isPast,
} from '@/lib/calendar';
import { useLocale } from '@/components/locale-provider';

type Filter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

function ImportanceIcon({ importance }: { importance: CalendarEvent['importance'] }) {
  if (importance === 'HIGH') return <span title="High Impact">🔴</span>;
  if (importance === 'MEDIUM') return <span title="Medium Impact">🟡</span>;
  return <span title="Low Impact">🟢</span>;
}

function EventRow({ event, locale }: { event: CalendarEvent; locale: string }) {
  const upcoming = isUpcoming(event);
  const past = isPast(event);

  const formattedDate = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(event.date));

  return (
    <div
      className={cn(
        'clay-card rounded-2xl px-5 py-4 transition-all',
        upcoming && 'ring-2 ring-gold dark:ring-gold-bright ring-offset-2 ring-offset-background',
        past && 'opacity-60'
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        {/* Date column */}
        <div className="min-w-[140px]">
          <div className="font-data text-xs text-muted-foreground">{formattedDate}</div>
          {upcoming && (
            <div className="mt-1 flex items-center gap-1">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold dark:bg-gold-bright" />
              <span className="font-handwritten text-xs text-gold-dark dark:text-gold-bright font-semibold">
                {locale === 'th' ? 'กำลังจะมาถึง!' : 'Coming up!'}
              </span>
            </div>
          )}
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xl" role="img" aria-label={event.country}>
              {event.countryFlag}
            </span>
            <h3 className="font-display text-base font-bold text-cream-dark dark:text-cream truncate">
              {event.title}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-data text-xs font-semibold',
                getImportanceBadge(event.importance)
              )}
            >
              <ImportanceIcon importance={event.importance} />
              {event.importance}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="clay-card-inset rounded-xl px-3 py-1.5">
              <div className="font-handwritten text-xs text-muted-foreground">
                {locale === 'th' ? 'ก่อนหน้า' : 'Previous'}
              </div>
              <div className="font-data text-sm font-bold text-cream-dark dark:text-cream">
                {event.previous || '—'}
              </div>
            </div>
            <div className="clay-card-inset rounded-xl px-3 py-1.5">
              <div className="font-handwritten text-xs text-muted-foreground">
                {locale === 'th' ? 'คาดการณ์' : 'Forecast'}
              </div>
              <div className="font-data text-sm font-bold text-cream-dark dark:text-cream">
                {event.forecast || '—'}
              </div>
            </div>
            {event.actual !== null && (
              <div className="clay-card-inset rounded-xl px-3 py-1.5">
                <div className="font-handwritten text-xs text-muted-foreground">
                  {locale === 'th' ? 'จริง' : 'Actual'}
                </div>
                <div className={cn('font-data text-sm font-bold', getImpactColor(event.impact).split(' ').slice(0, 2).join(' '))}>
                  {event.actual}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Impact badge */}
        <div className="flex-shrink-0">
          <span
            className={cn(
              'inline-flex rounded-xl px-3 py-1 font-data text-xs font-bold',
              getImpactColor(event.impact)
            )}
          >
            {event.impact === 'BULLISH' && '▲ '}
            {event.impact === 'BEARISH' && '▼ '}
            {event.impact === 'NEUTRAL' && '● '}
            {event.impact}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EconomicCalendar() {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<Filter>('ALL');

  const events = useMemo(() => fetchEconomicCalendar(), []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return events;
    return events.filter((e) => e.importance === filter);
  }, [events, filter]);

  const filterOptions: { label: string; value: Filter; icon: string }[] = [
    { label: locale === 'th' ? 'ทั้งหมด' : 'All', value: 'ALL', icon: '📋' },
    { label: locale === 'th' ? 'สูง' : 'High', value: 'HIGH', icon: '🔴' },
    { label: locale === 'th' ? 'กลาง' : 'Medium', value: 'MEDIUM', icon: '🟡' },
    { label: locale === 'th' ? 'ต่ำ' : 'Low', value: 'LOW', icon: '🟢' },
  ];

  const upcomingCount = events.filter(isUpcoming).length;

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-cream-dark dark:text-cream mb-1">
            {locale === 'th' ? '📅 ปฏิทินเศรษฐกิจ' : '📅 Economic Calendar'}
          </h2>
          <p className="font-handwritten text-sm text-muted-foreground">
            {locale === 'th'
              ? 'เหตุการณ์สำคัญที่กระทบ XAUUSD ใน -7 ถึง +14 วัน'
              : 'Key events impacting XAUUSD within -7 to +14 days'}
          </p>
        </div>

        {upcomingCount > 0 && (
          <div className="clay-card rounded-2xl px-4 py-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold dark:bg-gold-bright" />
            <span className="font-handwritten text-sm text-gold-dark dark:text-gold-bright font-semibold">
              {upcomingCount}{' '}
              {locale === 'th' ? 'เหตุการณ์ใกล้มา (24h)' : 'event(s) within 24h'}
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'clay-btn flex items-center gap-1.5 rounded-xl px-4 py-2 font-handwritten text-sm font-semibold transition-all',
              filter === opt.value
                ? 'bg-gold/10 text-gold-dark dark:text-gold-bright shadow-inner'
                : 'text-cream-dark dark:text-cream hover:text-gold-dark dark:hover:text-gold-bright'
            )}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="clay-card rounded-2xl p-8 text-center">
            <p className="font-handwritten text-sm text-muted-foreground">
              {locale === 'th' ? 'ไม่มีเหตุการณ์ในตัวกรองนี้' : 'No events match this filter'}
            </p>
          </div>
        ) : (
          filtered.map((event) => (
            <EventRow key={event.id} event={event} locale={locale} />
          ))
        )}
      </div>
    </section>
  );
}
