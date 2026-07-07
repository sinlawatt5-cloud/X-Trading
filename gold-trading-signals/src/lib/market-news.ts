export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentimentScore: number;
  sentimentLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
};

export type NewsSnapshot = {
  source: 'alphavantage' | 'mock';
  score: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  headlines: NewsItem[];
};

type NewsSettings = {
  marketDataProvider: string;
  marketDataApiKey: string | null;
};

type AlphaNewsItem = {
  title?: string;
  summary?: string;
  url?: string;
  source?: string;
  time_published?: string;
  overall_sentiment_score?: number | string;
  overall_sentiment_label?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toIsoDate(value?: string) {
  if (!value) return new Date().toISOString();
  if (/^\d{8}T\d{4}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    const hour = value.slice(9, 11);
    const minute = value.slice(11, 13);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function labelFromScore(score: number): NewsItem['sentimentLabel'] {
  if (score >= 60) return 'BULLISH';
  if (score <= 40) return 'BEARISH';
  return 'NEUTRAL';
}

function normalizeAlphaVantageItem(item: AlphaNewsItem, index: number): NewsItem {
  const rawScore =
    typeof item.overall_sentiment_score === 'number'
      ? item.overall_sentiment_score
      : parseFloat(item.overall_sentiment_score ?? '');
  const normalizedScore = Number.isFinite(rawScore)
    ? clamp(((rawScore + 1) / 2) * 100, 0, 100)
    : 50;

  return {
    id: `${item.url ?? 'headline'}-${index}`,
    title: item.title?.trim() || `Gold market update ${index + 1}`,
    summary: item.summary?.trim() || 'No summary available.',
    url: item.url?.trim() || '#',
    source: item.source?.trim() || 'Alpha Vantage',
    publishedAt: toIsoDate(item.time_published),
    sentimentScore: normalizedScore,
    sentimentLabel: labelFromScore(normalizedScore),
  };
}

function scoreFromHeadlines(headlines: NewsItem[]) {
  if (headlines.length === 0) return 50;
  const average = headlines.reduce((sum, item) => sum + item.sentimentScore, 0) / headlines.length;
  return clamp(average, 0, 100);
}

function biasFromScore(score: number): NewsSnapshot['bias'] {
  if (score >= 58) return 'BULLISH';
  if (score <= 42) return 'BEARISH';
  return 'NEUTRAL';
}

function generateMockNews(): NewsSnapshot {
  const now = Date.now();
  const headlines: NewsItem[] = [
    {
      id: 'mock-1',
      title: 'Gold traders wait for macro catalysts before fresh breakout',
      summary: 'Price action stays balanced as traders monitor inflation and rate expectations.',
      url: '#',
      source: 'Mock Feed',
      publishedAt: new Date(now - 30 * 60 * 1000).toISOString(),
      sentimentScore: 52,
      sentimentLabel: 'NEUTRAL',
    },
    {
      id: 'mock-2',
      title: 'Safe-haven demand supports gold on short-term pullbacks',
      summary: 'Buyers are still defending downside zones despite mixed momentum across sessions.',
      url: '#',
      source: 'Mock Feed',
      publishedAt: new Date(now - 90 * 60 * 1000).toISOString(),
      sentimentScore: 61,
      sentimentLabel: 'BULLISH',
    },
    {
      id: 'mock-3',
      title: 'Dollar strength limits upside in intraday gold moves',
      summary: 'A firmer dollar caps impulsive rallies and keeps traders selective near resistance.',
      url: '#',
      source: 'Mock Feed',
      publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      sentimentScore: 43,
      sentimentLabel: 'NEUTRAL',
    },
  ];

  const score = scoreFromHeadlines(headlines);
  return {
    source: 'mock',
    score,
    bias: biasFromScore(score),
    headlines,
  };
}

async function fetchAlphaVantageNews(apiKey: string): Promise<NewsSnapshot | null> {
  const url =
    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT` +
    `&topics=financial_markets,economy_macro,economy_monetary` +
    `&tickers=FOREX:XAU,FOREX:USD` +
    `&sort=LATEST&limit=10&apikey=${apiKey}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage news error: ${response.status}`);
  }

  const data = (await response.json()) as { feed?: AlphaNewsItem[]; Information?: string; Note?: string };
  if (!Array.isArray(data.feed) || data.feed.length === 0) {
    return null;
  }

  const headlines = data.feed.slice(0, 6).map(normalizeAlphaVantageItem);
  const score = scoreFromHeadlines(headlines);
  return {
    source: 'alphavantage',
    score,
    bias: biasFromScore(score),
    headlines,
  };
}

export async function getMarketNews(settings: NewsSettings): Promise<NewsSnapshot> {
  const apiKey = settings.marketDataApiKey;
  const provider = settings.marketDataProvider;

  if (provider === 'alphavantage' && apiKey) {
    try {
      const snapshot = await fetchAlphaVantageNews(apiKey);
      if (snapshot) return snapshot;
    } catch (error) {
      console.error('Failed to fetch Alpha Vantage news:', error);
    }
  }

  return generateMockNews();
}
