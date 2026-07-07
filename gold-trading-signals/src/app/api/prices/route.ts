import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'

interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function generateMockData(count: number = 100): Candle[] {
  const candles: Candle[] = []
  const now = new Date()
  let basePrice = 2350 + Math.random() * 50

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 15 * 60 * 1000)
    const open = basePrice + (Math.random() - 0.5) * 20
    const close = open + (Math.random() - 0.5) * 30
    const high = Math.max(open, close) + Math.random() * 15
    const low = Math.min(open, close) - Math.random() * 15
    const volume = Math.floor(Math.random() * 10000) + 1000

    candles.push({
      time: time.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })

    basePrice = close
  }

  return candles
}

async function fetchYahooFinanceFallback(intervalParam: string = '15m'): Promise<Candle[]> {
  try {
    const mapYFInterval = (i: string) => {
      switch(i) {
        case '1m': return { i: '1m', r: '7d' };
        case '5m': return { i: '5m', r: '60d' };
        case '15m': return { i: '15m', r: '60d' };
        case '1h': return { i: '60m', r: '730d' };
        case '4h': return { i: '60m', r: '730d' };
        case '1D': return { i: '1d', r: '10y' };
        default: return { i: '15m', r: '60d' };
      }
    };
    const { i, r } = mapYFInterval(intervalParam);
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=${i}&range=${r}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Yahoo Finance fetch failed');
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('Invalid Yahoo Finance format');
    
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open[i];
      const c = quote.close[i];
      if (o !== null && c !== null && o !== undefined && c !== undefined) {
        const openVal = Number(o);
        const closeVal = Number(c);
        const highVal = quote.high[i] !== null ? Number(quote.high[i]) : Math.max(openVal, closeVal);
        const lowVal = quote.low[i] !== null ? Number(quote.low[i]) : Math.min(openVal, closeVal);

        candles.push({
          time: new Date(timestamps[i] * 1000).toISOString(),
          open: parseFloat(openVal.toFixed(2)),
          high: parseFloat(highVal.toFixed(2)),
          low: parseFloat(lowVal.toFixed(2)),
          close: parseFloat(closeVal.toFixed(2)),
          volume: quote.volume[i] || 0,
        });
      }
    }
    return candles.slice(-500);
  } catch (err) {
    console.error('YFinance fallback failed:', err);
    return generateMockData();
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intervalParam = searchParams.get('interval') || '15m';

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    const apiKey = settings?.marketDataApiKey

    if (!apiKey) {
      const fallbackData = await fetchYahooFinanceFallback(intervalParam)
      return NextResponse.json({ data: fallbackData, source: 'yfinance' })
    }

    const provider = settings?.marketDataProvider || 'twelvedata'

    if (provider === 'twelvedata') {
      const mapTwelveDataInterval = (i: string) => {
        switch(i) {
          case '1m': return '1min';
          case '5m': return '5min';
          case '15m': return '15min';
          case '1h': return '1h';
          case '4h': return '4h';
          case '1D': return '1day';
          default: return '15min';
        }
      };
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${mapTwelveDataInterval(intervalParam)}&outputsize=500&apikey=${apiKey}`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error(`Twelve Data API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.values) {
        const candles: Candle[] = data.values.reverse().map((item: Record<string, string>) => ({
          time: item.datetime,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseInt(item.volume || '0', 10),
        }))

        return NextResponse.json({ data: candles, source: 'twelvedata' })
      }
    } else if (provider === 'alphavantage') {
      const mapAlphaVantageInterval = (i: string) => {
        switch(i) {
          case '1m': return '1min';
          case '5m': return '5min';
          case '15m': return '15min';
          case '1h': return '60min';
          case '4h': return '60min';
          case '1D': return '60min';
          default: return '15min';
        }
      };
      const response = await fetch(
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=${mapAlphaVantageInterval(intervalParam)}&outputsize=full&apikey=${apiKey}`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`)
      }

      const data = await response.json()

      const timeSeriesKey = Object.keys(data).find((key) =>
        key.includes('Time Series')
      )

      if (timeSeriesKey && data[timeSeriesKey]) {
        const timeSeries = data[timeSeriesKey]
        const candles: Candle[] = Object.entries(timeSeries)
          .slice(0, 500)
          .reverse()
          .map(([time, values]) => ({
            time,
            open: parseFloat((values as Record<string, string>)['1. open']),
            high: parseFloat((values as Record<string, string>)['2. high']),
            low: parseFloat((values as Record<string, string>)['3. low']),
            close: parseFloat((values as Record<string, string>)['4. close']),
            volume: parseInt((values as Record<string, string>)['5. volume'] || '0', 10),
          }))

        return NextResponse.json({ data: candles, source: 'alphavantage' })
      }
    }

    const fallbackData = await fetchYahooFinanceFallback(intervalParam)
    return NextResponse.json({ data: fallbackData, source: 'yfinance' })
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    const fallbackData = await fetchYahooFinanceFallback('15m')
    return NextResponse.json({ data: fallbackData, source: 'yfinance' })
  }
}