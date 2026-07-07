import { prisma } from '@/lib/prisma';

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

export type AnalysisRunResult = {
  signal: Awaited<ReturnType<typeof prisma.signal.create>>;
  source: string;
  indicators: IndicatorSnapshot;
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

function generateMockSignal(indicators: IndicatorSnapshot, timeframe = 'H1'): LlmSignalPayload {
  const type = indicators.rsi < 45 ? 'BUY' : indicators.rsi > 55 ? 'SELL' : 'NEUTRAL';
  const entry = parseFloat(indicators.lastPrice.toFixed(2));
  const takeProfit =
    type === 'BUY'
      ? parseFloat((entry + 18 + Math.abs(indicators.macd.histogram) * 8).toFixed(2))
      : type === 'SELL'
        ? parseFloat((entry - 18 - Math.abs(indicators.macd.histogram) * 8).toFixed(2))
        : parseFloat((entry + 5).toFixed(2));
  const stopLoss =
    type === 'BUY'
      ? parseFloat((entry - 12 - Math.abs(indicators.macd.histogram) * 6).toFixed(2))
      : type === 'SELL'
        ? parseFloat((entry + 12 + Math.abs(indicators.macd.histogram) * 6).toFixed(2))
        : parseFloat((entry - 5).toFixed(2));
  const confidence = Math.max(50, Math.min(95, 60 + Math.abs(indicators.macd.histogram) * 25));

  return {
    type,
    entry,
    takeProfit,
    stopLoss,
    confidence: parseFloat(confidence.toFixed(1)),
    reasoning:
      type === 'BUY'
        ? `Bullish bias detected on ${timeframe} with RSI below midline and improving momentum.`
        : type === 'SELL'
          ? `Bearish bias detected on ${timeframe} with RSI above midline and weakening momentum.`
          : `Neutral conditions on ${timeframe}; indicators are mixed and price is balanced.`,
    confluence: [
      { factor: 'RSI Momentum', weight: 0.3 },
      { factor: 'MACD Histogram', weight: 0.25 },
      { factor: 'MA Structure', weight: 0.2 },
      { factor: 'Bollinger Position', weight: 0.15 },
      { factor: 'Price Action', weight: 0.1 },
    ],
    analysis: {
      indicators,
      smc: {},
      wyckoff: {},
      mta: {},
    },
  };
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
    return generateMockSignal(indicators, timeframe);
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
  const prompt = buildPrompt(prices, indicators);
  const llmResponse = await callLLM(settings, prompt);
  const signalPayload = llmResponse
    ? parseSignalPayload(llmResponse, indicators, timeframe)
    : generateMockSignal(indicators, timeframe);

  const signal = await prisma.signal.create({
    data: {
      type: signalPayload.type ?? 'NEUTRAL',
      timeframe,
      entry: signalPayload.entry ?? indicators.lastPrice,
      takeProfit: signalPayload.takeProfit ?? indicators.lastPrice,
      stopLoss: signalPayload.stopLoss ?? indicators.lastPrice,
      confidence: signalPayload.confidence ?? 70,
      confluence: JSON.stringify(signalPayload.confluence ?? []),
      reasoning:
        signalPayload.reasoning ??
        `Generated signal based on RSI ${indicators.rsi.toFixed(2)} and MACD ${indicators.macd.histogram.toFixed(2)}`,
      analysis: JSON.stringify({
        indicators,
        source,
        raw: signalPayload.analysis ?? {},
        smc: signalPayload.smc ?? {},
        wyckoff: signalPayload.wyckoff ?? {},
        mta: signalPayload.mta ?? {},
      }),
      status: 'ACTIVE',
    },
  });

  return {
    signal,
    source,
    indicators,
    duration: Date.now() - startTime,
    pricesCount: prices.length,
  };
}

export async function getCurrentIndicators(settings: AnalysisSettings): Promise<{ indicators: IndicatorSnapshot; source: string; pricesCount: number }> {
  const { data: prices, source } = await fetchPriceData(settings);

  if (prices.length < 2) {
    throw new Error('No price data available');
  }

  return {
    indicators: calculateIndicators(prices),
    source,
    pricesCount: prices.length,
  };
}
