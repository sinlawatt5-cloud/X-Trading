import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    const apiKey = settings?.marketDataApiKey

    if (!apiKey) {
      const mockData = generateMockData()
      return NextResponse.json({ data: mockData, source: 'mock' })
    }

    const provider = settings?.marketDataProvider || 'twelvedata'

    if (provider === 'twelvedata') {
      const response = await fetch(
        `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=15min&outputsize=100&apikey=${apiKey}`
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
      const response = await fetch(
        `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=15min&outputsize=compact&apikey=${apiKey}`
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
          .slice(0, 100)
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

    const mockData = generateMockData()
    return NextResponse.json({ data: mockData, source: 'mock' })
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    const mockData = generateMockData()
    return NextResponse.json({ data: mockData, source: 'mock' })
  }
}