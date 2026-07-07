import { prisma } from '@/lib/prisma';
import {
  buildExpertAnalysis,
  detectMTA,
  detectSMC,
  detectWyckoff,
  type Candle as AnalysisCandle,
  type ExpertAnalysis,
} from '@/lib/analysis';
import { getMarketNews, type NewsSnapshot } from '@/lib/market-news';

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalysisSettings {
  llmProvider: string;
  llmApiKey: string | null;
  marketDataProvider: string;
  marketDataApiKey: string | null;
}

export interface IndicatorSnapshot {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  sma50: number;
  sma200: number;
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
  lastPrice: number;
}

type LlmSignalPayload = {
  type?: 'BUY' | 'SELL' | 'NEUTRAL' | string;
  entry?: number;
  takeProfit?: number;
  stopLoss?: number;
  confidence?: number;
  reasoning?: string;
  confluence?: unknown;
  analysis?: unknown;
  smc?: unknown;
  wyckoff?: unknown;
  mta?: unknown;
};

type ExpertConfluence = {
  score: number;
  factors: string[];
};

type ExpertSignalPayload = {
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  reasoning: string;
  confluence: ExpertConfluence;
  analysis: {
    smc: ExpertAnalysis['smc'];
    wyckoff: ExpertAnalysis['wyckoff'];
    mta: ExpertAnalysis['mta'];
    indicatorScore: number;
    newsScore: number;
    confluence: number;
    source?: string;
    raw?: unknown;
  };
};

export type AnalysisRunResult = {
  signal: Awaited<ReturnType<typeof prisma.signal.create>>;
  source: string;
  indicators: IndicatorSnapshot;
  news: NewsSnapshot;
  duration: number;
  pricesCount: number;
};

function generateMockData(count: number = 100): Candle[] {
  const candles: Candle[] = [];
  const now = new Date();
  let basePrice = 2350 + Math.random() * 50;

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 15 * 60 * 1000);
    const open = basePrice + (Math.random() - 0.5) * 20;
    const close = open + (Math.random() - 0.5) * 30;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    const volume = Math.floor(Math.random() * 10000) + 1000;

    candles.push({
      time: time.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    basePrice = close;
  }

  return candles;
}

function parseTwelveData(values: Record<string, string>[]): Candle[] {
  return values
    .map((item) => ({
      time: item.datetime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume || '0', 10),
    }))
    .reverse();
}

function parseAlphaVantage(series: Record<string, Record<string, string>>): Candle[] {
  return Object.entries(series)
    .slice(0, 100)
    .reverse()
    .map(([time, values]) => ({
      time,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'] || '0', 10),
    }));
}

function toAnalysisCandles(prices: Candle[]): AnalysisCandle[] {
  return prices.map((price) => ({
    time: new Date(price.time).getTime() / 1000,
    open: price.open,
    high: price.high,
    low: price.low,
    close: price.close,
    volume: price.volume,
  }));
}

function deriveIndicatorScore(indicators: IndicatorSnapshot) {
  let score = 50;

  if (indicators.rsi < 35) score += 10;
  if (indicators.rsi > 65) score -= 10;
  if (indicators.macd.histogram > 0) score += 10;
  if (indicators.macd.histogram < 0) score -= 10;
  if (indicators.sma20 > indicators.sma50) score += 8;
  if (indicators.sma50 > indicators.sma200) score += 7;
  if (indicators.lastPrice > indicators.bb.middle) score += 5;
  if (indicators.lastPrice < indicators.bb.middle) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function buildExpertPrompt(
  prices: Candle[],
  indicators: IndicatorSnapshot,
  expert: ExpertAnalysis
): string {
  const lastCandle = prices[prices.length - 1];
  const prevCandle = prices[prices.length - 2] ?? lastCandle;

  return `You are a professional XAUUSD strategist. Use SMC, Wyckoff, multi-timeframe analysis, and indicators to return ONLY valid JSON.

## Market Data
Current Price: $${lastCandle.close.toFixed(2)}
Previous Close: $${prevCandle.close.toFixed(2)}
High: $${lastCandle.high.toFixed(2)}
Low: $${lastCandle.low.toFixed(2)}

## Indicator Snapshot
RSI(14): ${indicators.rsi.toFixed(2)}
MACD Histogram: ${indicators.macd.histogram.toFixed(2)}
SMA20: $${indicators.sma20.toFixed(2)}
SMA50: $${indicators.sma50.toFixed(2)}
SMA200: $${indicators.sma200.toFixed(2)}

## Expert Analysis
SMC Score: ${expert.smc.score.toFixed(0)}
Wyckoff Score: ${expert.wyckoff.score.toFixed(0)}
MTA Score: ${expert.mta.score.toFixed(0)}
Indicator Score: ${expert.indicatorScore.toFixed(0)}
News Score: ${expert.newsScore.toFixed(0)}
Confluence: ${expert.confluence.toFixed(0)}
Dominant Signal: ${expert.signal}

## SMC Detail
Trend: ${expert.smc.structure.trend}
Broken BOS: ${expert.smc.structure.broken}
Order Blocks: ${expert.smc.orderBlocks.length}
FVG: ${expert.smc.fvgs.length}

## Wyckoff Detail
Phase: ${expert.wyckoff.phase}
Spring: ${expert.wyckoff.spring}
Upthrust: ${expert.wyckoff.upthrust}
Volume Confirmation: ${expert.wyckoff.volumeConfirmation}

## Multi-Timeframe Detail
D1: ${expert.mta.d1.alignment}
H4: ${expert.mta.h4.alignment}
H1: ${expert.mta.h1.alignment}
M15: ${expert.mta.m15.alignment}

Rules:
- If confluence is below 75, return NEUTRAL.
- If you choose BUY or SELL, keep entry near current price and set sensible TP/SL.
- Reasoning should be concise and in Thai.

Return JSON:
{
  "type": "BUY" | "SELL" | "NEUTRAL",
  "entry": number,
  "takeProfit": number,
  "stopLoss": number,
  "confidence": number,
  "reasoning": string,
  "confluence": {
    "score": number,
    "factors": string[]
  },
  "analysis": {
    "smc": object,
    "wyckoff": object,
    "mta": object,
    "indicatorScore": number,
    "newsScore": number
  }
}`;
}

function buildExpertFallbackSignal(expert: ExpertAnalysis): ExpertSignalPayload {
  return {
    type: expert.signal,
    entry: expert.entry,
    takeProfit: expert.takeProfit,
    stopLoss: expert.stopLoss,
    confidence: Math.round(expert.confidence),
    reasoning: expert.reasoning,
    confluence: {
      score: Math.round(expert.confluence),
      factors: [
        `SMC ${expert.smc.score.toFixed(0)}`,
        `Wyckoff ${expert.wyckoff.score.toFixed(0)}`,
        `MTA ${expert.mta.score.toFixed(0)}`,
        `Indicators ${expert.indicatorScore.toFixed(0)}`,
        `News ${expert.newsScore.toFixed(0)}`,
      ],
    },
    analysis: {
      smc: expert.smc,
      wyckoff: expert.wyckoff,
      mta: expert.mta,
      indicatorScore: expert.indicatorScore,
      newsScore: expert.newsScore,
      confluence: expert.confluence,
    },
  };
}

function normalizeExpertPayload(payload: LlmSignalPayload, expert: ExpertAnalysis, source: string): ExpertSignalPayload {
  const fallback = buildExpertFallbackSignal(expert);
  const confluenceScore =
    typeof payload.confluence === 'object' &&
    payload.confluence !== null &&
    'score' in payload.confluence &&
    typeof (payload.confluence as { score?: unknown }).score === 'number'
      ? (payload.confluence as { score: number }).score
      : fallback.confluence.score;

  return {
    type: expert.confluence >= 75 && (payload.type === 'BUY' || payload.type === 'SELL' || payload.type === 'NEUTRAL')
      ? payload.type
      : 'NEUTRAL',
    entry: typeof payload.entry === 'number' ? payload.entry : fallback.entry,
    takeProfit: typeof payload.takeProfit === 'number' ? payload.takeProfit : fallback.takeProfit,
    stopLoss: typeof payload.stopLoss === 'number' ? payload.stopLoss : fallback.stopLoss,
    confidence: typeof payload.confidence === 'number' ? payload.confidence : fallback.confidence,
    reasoning: typeof payload.reasoning === 'string' && payload.reasoning.trim() ? payload.reasoning : fallback.reasoning,
    confluence: {
      score: Math.round(confluenceScore),
      factors: fallback.confluence.factors,
    },
    analysis: {
      smc: expert.smc,
      wyckoff: expert.wyckoff,
      mta: expert.mta,
      indicatorScore: expert.indicatorScore,
      newsScore: expert.newsScore,
      confluence: expert.confluence,
      source,
      raw: payload.analysis ?? {
        smc: payload.smc,
        wyckoff: payload.wyckoff,
        mta: payload.mta,
      },
    },
  };
}

export async function fetchPriceData(settings: AnalysisSettings): Promise<{ data: Candle[]; source: string }> {
  const apiKey = settings.marketDataApiKey;

  if (!apiKey) {
    return { data: generateMockData(), source: 'mock' };
  }

  const provider = settings.marketDataProvider || 'twelvedata';

  try {
    if (provider === 'twelvedata') {
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=15min&outputsize=100&apikey=${apiKey}`,
        { signal: AbortSignal.timeout(10_000) }
      );

      if (!response.ok) {
        throw new Error(`Twelve Data API error: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.values)) {
        return { data: parseTwelveData(data.values), source: 'twelvedata' };
      }
    }

    if (provider === 'alphavantage') {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=15min&outputsize=compact&apikey=${apiKey}`,
        { signal: AbortSignal.timeout(10_000) }
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();
      const timeSeriesKey = Object.keys(data).find((key) => key.includes('Time Series'));

      if (timeSeriesKey && data[timeSeriesKey]) {
        return {
          data: parseAlphaVantage(data[timeSeriesKey] as Record<string, Record<string, string>>),
          source: 'alphavantage',
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch price data:', error);
  }

  return { data: generateMockData(), source: 'mock' };
}

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(data[i]);
      continue;
    }

    const sum = data.slice(i - period + 1, i + 1).reduce((acc, value) => acc + value, 0);
    sma.push(sum / period);
  }

  return sma;
}

function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const ema: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }

  return ema;
}

function calculateRSI(closes: number[], period: number): number[] {
  if (closes.length < period + 1) return Array(closes.length).fill(50);

  const rsi: number[] = Array(period).fill(50);
  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  let avgGain = gain / period;
  let avgLoss = loss / period;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = ((avgGain * (period - 1)) + (diff > 0 ? diff : 0)) / period;
    avgLoss = ((avgLoss * (period - 1)) + (diff < 0 ? -diff : 0)) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return rsi;
}

function calculateMACD(closes: number[]) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  const signal = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((value, index) => value - signal[index]);

  return { macd: macdLine, signal, histogram };
}

function calculateBB(closes: number[], period: number, stdDev: number) {
  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }

    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, value) => acc + value, 0) / period;
    const variance = slice.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }

  return { upper, middle, lower };
}

export function calculateIndicators(prices: Candle[]): IndicatorSnapshot {
  const closes = prices.map((price) => price.close);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const bb = calculateBB(closes, 20, 2);

  return {
    rsi: rsi[rsi.length - 1] ?? 50,
    macd: {
      macd: macd.macd[macd.macd.length - 1] ?? 0,
      signal: macd.signal[macd.signal.length - 1] ?? 0,
      histogram: macd.histogram[macd.histogram.length - 1] ?? 0,
    },
    sma20: sma20[sma20.length - 1] ?? closes[closes.length - 1] ?? 0,
    sma50: sma50[sma50.length - 1] ?? closes[closes.length - 1] ?? 0,
    sma200: sma200[sma200.length - 1] ?? closes[closes.length - 1] ?? 0,
    bb: {
      upper: bb.upper[bb.upper.length - 1] ?? closes[closes.length - 1] ?? 0,
      middle: bb.middle[bb.middle.length - 1] ?? closes[closes.length - 1] ?? 0,
      lower: bb.lower[bb.lower.length - 1] ?? closes[closes.length - 1] ?? 0,
    },
    lastPrice: closes[closes.length - 1] ?? 0,
  };
}

export function buildPrompt(prices: Candle[], indicators: IndicatorSnapshot): string {
  const lastCandle = prices[prices.length - 1];
  const prevCandle = prices[prices.length - 2] ?? lastCandle;

  return `You are a professional gold (XAUUSD) trader. Analyze the following data and return ONLY a JSON object (no other text).

## Market Data
Current Price: $${lastCandle.close.toFixed(2)}
Previous Close: $${prevCandle.close.toFixed(2)}
High: $${lastCandle.high.toFixed(2)}
Low: $${lastCandle.low.toFixed(2)}

## Indicators
RSI(14): ${indicators.rsi.toFixed(2)}
MACD: ${indicators.macd.macd.toFixed(2)} / Signal: ${indicators.macd.signal.toFixed(2)} / Histogram: ${indicators.macd.histogram.toFixed(2)}
SMA20: $${indicators.sma20.toFixed(2)}
SMA50: $${indicators.sma50.toFixed(2)}
SMA200: $${indicators.sma200.toFixed(2)}
Bollinger Upper: $${indicators.bb.upper.toFixed(2)}
Bollinger Middle: $${indicators.bb.middle.toFixed(2)}
Bollinger Lower: $${indicators.bb.lower.toFixed(2)}

Return JSON:
{
  "type": "BUY" | "SELL" | "NEUTRAL",
  "entry": number,
  "takeProfit": number,
  "stopLoss": number,
  "confidence": number,
  "reasoning": string,
  "confluence": [],
  "analysis": {}
}`;
}

export async function callLLM(settings: AnalysisSettings, prompt: string): Promise<string | null> {
  const apiKey = settings.llmApiKey;
  const provider = settings.llmProvider;

  const configs: Record<
    string,
    {
      url: string;
      formatBody: (prompt: string) => unknown;
      parseResponse: (response: unknown) => string | null;
    }
  > = {
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      formatBody: (promptText) => ({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: promptText }],
        max_tokens: 500,
      }),
      parseResponse: (response) => (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? null,
    },
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      formatBody: (promptText) => ({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptText }],
        max_tokens: 500,
      }),
      parseResponse: (response) => (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? null,
    },
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      formatBody: (promptText) => ({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: promptText }],
      }),
      parseResponse: (response) => (response as { content?: Array<{ text?: string }> })?.content?.[0]?.text ?? null,
    },
  };

  const config = configs[provider];
  if (!config || !apiKey) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(config.formatBody(prompt)),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();
    let content = config.parseResponse(data);

    if (!content) return null;

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return content;
  } catch (error) {
    console.error('Failed to call LLM:', error);
    return null;
  }
}

function parseSignalPayload(raw: string, indicators: IndicatorSnapshot, timeframe: string): LlmSignalPayload {
  try {
    const parsed = JSON.parse(raw) as LlmSignalPayload;
    return {
      ...parsed,
      type: parsed.type === 'BUY' || parsed.type === 'SELL' || parsed.type === 'NEUTRAL' ? parsed.type : 'NEUTRAL',
      entry: typeof parsed.entry === 'number' ? parsed.entry : indicators.lastPrice,
      takeProfit: typeof parsed.takeProfit === 'number' ? parsed.takeProfit : indicators.lastPrice,
      stopLoss: typeof parsed.stopLoss === 'number' ? parsed.stopLoss : indicators.lastPrice,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 70,
      reasoning: typeof parsed.reasoning === 'string' && parsed.reasoning ? parsed.reasoning : `AI analysis for ${timeframe}`,
    };
  } catch {
    return {
      type: 'NEUTRAL',
      entry: indicators.lastPrice,
      takeProfit: indicators.lastPrice,
      stopLoss: indicators.lastPrice,
      confidence: 70,
      reasoning: `AI analysis for ${timeframe}`,
    };
  }
}

export async function runGoldAnalysis(
  settings: AnalysisSettings,
  options: { timeframe?: string } = {}
): Promise<AnalysisRunResult> {
  const startTime = Date.now();
  const timeframe = options.timeframe ?? 'H1';
  const { data: prices, source } = await fetchPriceData(settings);

  if (prices.length < 2) {
    throw new Error('No price data available');
  }

  const indicators = calculateIndicators(prices);
  const news = await getMarketNews(settings);
  const analysisCandles = toAnalysisCandles(prices);
  const smc = detectSMC(analysisCandles);
  const wyckoff = detectWyckoff(analysisCandles);
  const mta = detectMTA(analysisCandles);
  const indicatorScore = deriveIndicatorScore(indicators);
  const expert = buildExpertAnalysis({
    smc,
    wyckoff,
    mta,
    indicatorScore,
    newsScore: news.score,
    candles: analysisCandles,
  });
  const prompt = buildExpertPrompt(prices, indicators, expert);
  const llmResponse = await callLLM(settings, prompt);
  const parsedPayload = llmResponse ? parseSignalPayload(llmResponse, indicators, timeframe) : null;
  const signalPayload = parsedPayload
    ? normalizeExpertPayload(parsedPayload, expert, source)
    : buildExpertFallbackSignal(expert);

  const signal = await prisma.signal.create({
    data: {
      type: signalPayload.type,
      timeframe,
      entry: signalPayload.entry,
      takeProfit: signalPayload.takeProfit,
      stopLoss: signalPayload.stopLoss,
      confidence: signalPayload.confidence,
      confluence: JSON.stringify(signalPayload.confluence),
      reasoning: signalPayload.reasoning,
      analysis: JSON.stringify({
        indicators,
        source,
        news,
        expert,
        raw: signalPayload.analysis.raw ?? {},
        analysis: signalPayload.analysis,
      }),
      status: 'ACTIVE',
    },
  });

  return {
    signal,
    source,
    indicators,
    news,
    duration: Date.now() - startTime,
    pricesCount: prices.length,
  };
}

export async function getCurrentIndicators(
  settings: AnalysisSettings
): Promise<{ indicators: IndicatorSnapshot; source: string; pricesCount: number; analysis: ExpertAnalysis; news: NewsSnapshot }> {
  const { data: prices, source } = await fetchPriceData(settings);

  if (prices.length < 2) {
    throw new Error('No price data available');
  }

  const indicators = calculateIndicators(prices);
  const news = await getMarketNews(settings);
  const analysisCandles = toAnalysisCandles(prices);
  const smc = detectSMC(analysisCandles);
  const wyckoff = detectWyckoff(analysisCandles);
  const mta = detectMTA(analysisCandles);
  const indicatorScore = deriveIndicatorScore(indicators);
  const analysis = buildExpertAnalysis({
    smc,
    wyckoff,
    mta,
    indicatorScore,
    newsScore: news.score,
    candles: analysisCandles,
  });

  return {
    indicators,
    source,
    pricesCount: prices.length,
    analysis,
    news,
  };
}
