import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateMockSignal() {
  const type = Math.random() > 0.5 ? 'BUY' : 'SELL'
  const timeframe = ['15M', '1H', '4H'][Math.floor(Math.random() * 3)]
  const basePrice = 2350 + Math.random() * 50

  const entry = parseFloat(basePrice.toFixed(2))
  const takeProfit = type === 'BUY'
    ? parseFloat((entry + 15 + Math.random() * 20).toFixed(2))
    : parseFloat((entry - 15 - Math.random() * 20).toFixed(2))
  const stopLoss = type === 'BUY'
    ? parseFloat((entry - 10 - Math.random() * 10).toFixed(2))
    : parseFloat((entry + 10 + Math.random() * 10).toFixed(2))
  const confidence = parseFloat((60 + Math.random() * 35).toFixed(1))

  const confluenceFactors = [
    { factor: 'SMC Order Block', weight: 0.3 },
    { factor: 'Wyckoff Accumulation', weight: 0.25 },
    { factor: 'Multi-TF Alignment', weight: 0.2 },
    { factor: 'Volume Confirmation', weight: 0.15 },
    { factor: 'Support/Resistance', weight: 0.1 },
  ]

  const reasoning = type === 'BUY'
    ? `Bullish signal detected based on ${timeframe} timeframe analysis. Price found support at key level with increasing volume. SMC order block identified providing strong support.`
    : `Bearish signal detected based on ${timeframe} timeframe analysis. Price rejected at resistance with declining momentum. Distribution pattern observed in Wyckoff analysis.`

  const analysis = {
    indicators: {
      rsi: parseFloat((30 + Math.random() * 40).toFixed(1)),
      macd: parseFloat((Math.random() * 2 - 1).toFixed(3)),
      ema: { fast: entry - 5 + Math.random() * 10, slow: entry - 8 + Math.random() * 16 },
    },
    smc: {
      orderBlocks: [{ type: 'bullish', price: entry - 10, strength: 0.8 }],
      fairValueGaps: [{ high: entry + 5, low: entry - 5 }],
    },
    wyckoff: {
      phase: 'Accumulation',
      support: entry - 20,
      resistance: entry + 25,
    },
  }

  return {
    type,
    timeframe,
    entry,
    takeProfit,
    stopLoss,
    confidence,
    confluence: confluenceFactors,
    reasoning,
    analysis,
  }
}

export async function POST() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    const apiKey = settings?.llmApiKey

    let signalData

    if (!apiKey) {
      signalData = generateMockSignal()
    } else {
      // TODO: Phase 3 - LLM Integration
      // Will use the configured LLM provider with the API key
      // For now, return mock signal
      signalData = generateMockSignal()
    }

    const signal = await prisma.signal.create({
      data: {
        type: signalData.type,
        timeframe: signalData.timeframe,
        entry: signalData.entry,
        takeProfit: signalData.takeProfit,
        stopLoss: signalData.stopLoss,
        confidence: signalData.confidence,
        confluence: JSON.stringify(signalData.confluence),
        reasoning: signalData.reasoning,
        analysis: JSON.stringify(signalData.analysis),
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(signal, { status: 201 })
  } catch (error) {
    console.error('Failed to generate signal:', error)
    return NextResponse.json(
      { error: 'Failed to generate signal' },
      { status: 500 }
    )
  }
}