export type CalendarEvent = {
  id: string;
  date: string; // ISO string
  title: string;
  country: string;
  countryFlag: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  previous: string;
  forecast: string;
  actual: string | null;
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
};

function daysFromNow(days: number, hour = 14, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function fetchEconomicCalendar(): CalendarEvent[] {
  return [
    {
      id: 'fomc-minutes-1',
      date: daysFromNow(-5, 19, 0),
      title: 'FOMC Minutes',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'HIGH',
      previous: 'Hawkish tone',
      forecast: '-',
      actual: 'Dovish shift noted',
      impact: 'BULLISH',
    },
    {
      id: 'cpi-us-1',
      date: daysFromNow(-3, 12, 30),
      title: 'US CPI (YoY)',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'HIGH',
      previous: '3.4%',
      forecast: '3.1%',
      actual: '3.0%',
      impact: 'BULLISH',
    },
    {
      id: 'dxy-index-1',
      date: daysFromNow(-1, 10, 0),
      title: 'USD Index (DXY) Weekly Review',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'MEDIUM',
      previous: '104.2',
      forecast: '103.8',
      actual: '103.5',
      impact: 'BULLISH',
    },
    {
      id: 'gdp-us-1',
      date: daysFromNow(0, 15, 30),
      title: 'US GDP (QoQ) Final',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'HIGH',
      previous: '1.6%',
      forecast: '1.3%',
      actual: null,
      impact: 'NEUTRAL',
    },
    {
      id: 'nfp-1',
      date: daysFromNow(2, 12, 30),
      title: 'Non-Farm Payrolls (NFP)',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'HIGH',
      previous: '175K',
      forecast: '185K',
      actual: null,
      impact: 'NEUTRAL',
    },
    {
      id: 'fomc-rate-1',
      date: daysFromNow(4, 18, 0),
      title: 'Fed Interest Rate Decision',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'HIGH',
      previous: '5.50%',
      forecast: '5.25%',
      actual: null,
      impact: 'BULLISH',
    },
    {
      id: 'ppi-us-1',
      date: daysFromNow(6, 12, 30),
      title: 'US PPI (MoM)',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'MEDIUM',
      previous: '0.2%',
      forecast: '0.1%',
      actual: null,
      impact: 'NEUTRAL',
    },
    {
      id: 'ecb-rate-1',
      date: daysFromNow(8, 11, 15),
      title: 'ECB Interest Rate Decision',
      country: 'EU',
      countryFlag: '🇪🇺',
      importance: 'HIGH',
      previous: '4.00%',
      forecast: '3.75%',
      actual: null,
      impact: 'BULLISH',
    },
    {
      id: 'gold-reserves-1',
      date: daysFromNow(10, 9, 0),
      title: 'US Gold Reserves Report',
      country: 'US',
      countryFlag: '🇺🇸',
      importance: 'MEDIUM',
      previous: '8,133.5t',
      forecast: '-',
      actual: null,
      impact: 'NEUTRAL',
    },
    {
      id: 'cpi-eu-1',
      date: daysFromNow(13, 10, 0),
      title: 'EU CPI Flash Estimate (YoY)',
      country: 'EU',
      countryFlag: '🇪🇺',
      importance: 'MEDIUM',
      previous: '2.6%',
      forecast: '2.4%',
      actual: null,
      impact: 'NEUTRAL',
    },
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getImpactColor(impact: CalendarEvent['impact']): string {
  switch (impact) {
    case 'BULLISH':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    case 'BEARISH':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    case 'NEUTRAL':
    default:
      return 'text-gold-dark dark:text-gold-bright bg-gold/10';
  }
}

export function getImportanceBadge(importance: CalendarEvent['importance']): string {
  switch (importance) {
    case 'HIGH':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
    case 'LOW':
    default:
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
  }
}

export function isUpcoming(event: CalendarEvent, hoursThreshold = 24): boolean {
  const now = Date.now();
  const eventTime = new Date(event.date).getTime();
  return eventTime > now && eventTime - now <= hoursThreshold * 3600 * 1000;
}

export function isPast(event: CalendarEvent): boolean {
  return new Date(event.date).getTime() < Date.now();
}
