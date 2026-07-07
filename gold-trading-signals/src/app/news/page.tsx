'use client';

import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';
import { cn } from '@/lib/utils';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentimentScore: number;
  sentimentLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
};

type NewsResponse = {
  source: 'alphavantage' | 'mock';
  score: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  headlines: NewsItem[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewsPage() {
  const { locale } = useLocale();
  const { data, error, isLoading } = useSWR<NewsResponse>('/api/news', fetcher, {
    refreshInterval: 5 * 60_000,
    revalidateOnFocus: true,
  });

  const scoreTone =
    (data?.score ?? 0) >= 58
      ? 'text-green-600 dark:text-green-400'
      : (data?.score ?? 0) <= 42
        ? 'text-red-600 dark:text-red-400'
        : 'text-gold-dark dark:text-gold-bright';

  const badgeTone = {
    BULLISH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    BEARISH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    NEUTRAL: 'bg-muted text-muted-foreground',
  } as const;

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display mb-2 text-3xl font-bold text-cream-dark dark:text-cream">
            {t('news.title', locale)}
          </h1>
          <p className="font-handwritten text-sm text-muted-foreground">
            {locale === 'th'
              ? 'เช็คอารมณ์ข่าวที่กระทบ XAUUSD แล้วโยงเข้าคะแนนวิเคราะห์'
              : 'Track macro headlines affecting XAUUSD and feed them into analysis.'}
          </p>
        </div>

        {data && (
          <div className="clay-card rounded-2xl px-5 py-4">
            <div className="font-handwritten text-xs text-muted-foreground">
              {locale === 'th' ? 'คะแนนข่าวรวม' : 'News Sentiment'}
            </div>
            <div className={cn('font-data text-3xl font-bold', scoreTone)}>{data.score.toFixed(0)}%</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={cn('font-data text-xs', badgeTone[data.bias])}>{data.bias}</Badge>
              <span className="font-handwritten text-xs text-muted-foreground">{data.source}</span>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="clay-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-handwritten text-sm text-muted-foreground">
            {locale === 'th' ? 'กำลังโหลดข่าวตลาด...' : 'Loading market news...'}
          </p>
        </div>
      )}

      {error && (
        <div className="clay-card rounded-2xl p-8 text-center">
          <p className="font-handwritten text-sm text-destructive">
            {locale === 'th' ? 'โหลดข่าวไม่สำเร็จ' : 'Failed to load market news'}
          </p>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="grid gap-5">
          {data.headlines.map((headline) => (
            <article key={headline.id} className="clay-card rounded-3xl p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className={cn('font-data text-xs', badgeTone[headline.sentimentLabel])}>
                  {headline.sentimentLabel}
                </Badge>
                <span className="font-handwritten text-xs text-muted-foreground">
                  {headline.source} - {formatDate(headline.publishedAt)}
                </span>
              </div>

              <h2 className="font-display mb-3 text-xl font-bold text-cream-dark dark:text-cream">
                {headline.title}
              </h2>

              <p className="font-body mb-4 text-sm leading-6 text-cream-dark/80 dark:text-cream/80">
                {headline.summary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="clay-card-inset rounded-2xl px-4 py-2">
                  <span className="font-handwritten text-xs text-muted-foreground">
                    {locale === 'th' ? 'คะแนนข่าว' : 'Sentiment Score'}
                  </span>
                  <div className="font-data text-lg font-bold text-gold-dark dark:text-gold-bright">
                    {headline.sentimentScore.toFixed(0)}%
                  </div>
                </div>

                {headline.url !== '#' && (
                  <a
                    href={headline.url}
                    target="_blank"
                    rel="noreferrer"
                    className="clay-btn px-4 py-2 font-handwritten text-sm text-cream-dark dark:text-cream"
                  >
                    {locale === 'th' ? 'เปิดข่าวต้นทาง' : 'Open source'}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
