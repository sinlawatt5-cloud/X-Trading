# Phase 3 - AI Gold Trading Signals Expert Analysis Implementation Plan

> **Goal:** Add SMC detection (Order Block, FVG, Liquidity), Wyckoff phase analysis, Multi-Timeframe confluence, and enhanced LLM prompts with confidence scoring

**Architecture:** Server-side calculation modules for SMC/Wyckoff/MTA, injected into LLM prompts for expert-level signal generation

**Tech Stack:** Next.js 15, TypeScript, Prisma + SQLite, LLM (OpenRouter/OpenAI/Anthropic)

## Global Constraints
- SMC detection uses price action only (no indicators needed for OB/FVG)
- Wyckoff phase detection uses price + volume
- Multi-TF analyzes M15, H1, H4, D1 alignments
- Confluence score = weighted average of SMC (30%) + Wyckoff (20%) + MTA (25%) + Indicators (15%) + News (10%)
- Signal sent to user only when confluence > 75%

---

### Task 1: SMC Detection Module

**Files:**
- Create: `lib/analysis/smc.ts`
- Create: `lib/analysis/types.ts`

- [ ] **Step 1: Write SMC types**

Write to `lib/analysis/types.ts`:

```typescript
export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type OrderBlock = {
  type: 'BULLISH' | 'BEARISH'
  startIndex: number
  endIndex: number
  price: number
  strength: number // 0-100
}

export type FVG = {
  type: 'BULLISH' | 'BEARISH'
  index: number
  gapHigh: number
  gapLow: number
  size: number // pips
}

export type LiquidityZone = {
  type: 'BUY_SIDE' | 'SELL_SIDE'
  price: number
  index: number
  swept: boolean
}

export type MarketStructure = {
  trend: 'BULLISH' | 'BEARISH' | 'RANGING'
  lastHH: number  // last higher high (bullish)
  lastHL: number  // last higher low (bullish)
  lastLH: number  // last lower high (bearish)
  lastLL: number  // last lower low (bearish)
  broken: boolean  // BOS occurred
}

export type SMCResult = {
  orderBlocks: OrderBlock[]
  fvgs: FVG[]
  liquidityZones: LiquidityZone[]
  structure: MarketStructure
  score: number // 0-100 how strong the SMC setup is
}

export type WyckoffResult = {
  phase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN' | 'UNKNOWN'
  spring: boolean
  upthrust: boolean
  volumeConfirmation: boolean
  score: number // 0-100
}

export type MTAResult = {
  d1: { trend: string; alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }
  h4: { trend: string; alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }
  h1: { trend: string; alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }
  m15: { trend: string; alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }
  score: number // 0-100 percentage of TFs aligned
}

export type AnalysisResult = {
  smc: SMCResult
  wyckoff: WyckoffResult
  mta: MTAResult
  confluence: number // final weighted score 0-100
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
  entry: number
  takeProfit: number
  stopLoss: number
  confidence: number
  reasoning: string
}
```

- [ ] **Step 2: Write SMC detection**

Write to `lib/analysis/smc.ts`:

```typescript
import { Candle, OrderBlock, FVG, LiquidityZone, MarketStructure, SMCResult } from './types'

export function detectSMC(candles: Candle[]): SMCResult {
  const structure = detectMarketStructure(candles)
  const orderBlocks = detectOrderBlocks(candles)
  const fvgs = detectFVG(candles)
  const liquidityZones = detectLiquidityZones(candles, structure)

  // Score calculation
  let score = 50 // base score

  // Recent order block near price = strong
  const lastOB = orderBlocks[orderBlocks.length - 1]
  if (lastOB && Math.abs(lastOB.price - candles[candles.length - 1].close) < 10) {
    score += 20
  }

  // FVG that hasn't been filled yet
  const unfilledFVG = fvgs.filter(f => {
    const idx = f.index
    return candles.slice(idx).every(c =>
      f.type === 'BULLISH' ? c.low > f.gapLow : c.high < f.gapHigh
    )
  })
  if (unfilledFVG.length > 0) score += 15

  // Structure break recently
  if (structure.broken) score += 15

  return {
    orderBlocks,
    fvgs,
    liquidityZones,
    structure,
    score: Math.min(score, 100),
  }
}

function detectMarketStructure(candles: Candle[]): MarketStructure {
  if (candles.length < 20) {
    return { trend: 'RANGING', lastHH: 0, lastHL: 0, lastLH: 0, lastLL: 0, broken: false }
  }

  const lookback = Math.min(20, Math.floor(candles.length / 2))
  const recent = candles.slice(-lookback)

  // Find swing highs and lows
  const swingHighs: number[] = []
  const swingLows: number[] = []

  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) {
      swingHighs.push(recent[i].high)
    }
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) {
      swingLows.push(recent[i].low)
    }
  }

  if (swingHighs.length < 2 || swingLows.length < 2) {
    return { trend: 'RANGING', lastHH: 0, lastHL: 0, lastLH: 0, lastLL: 0, broken: false }
  }

  const lastHH = swingHighs[swingHighs.length - 1]
  const prevHH = swingHighs[swingHighs.length - 2]
  const lastHL = swingLows[swingLows.length - 1]
  const prevHL = swingLows[swingLows.length - 2]
  const lastLH = swingLows[swingLows.length - 1]
  const prevLH = swingLows[swingLows.length - 2]
  const lastLL = swingHighs[swingHighs.length - 1]
  const prevLL = swingHighs[swingHighs.length - 2]

  // Bullish: higher highs + higher lows
  const bullish = lastHH > prevHH && lastHL > prevHL
  // Bearish: lower highs + lower lows
  const bearish = lastLH < prevLH && lastLL < prevLL

  let trend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'RANGING'
  let broken = false

  if (bullish) {
    trend = 'BULLISH'
    // BOS = price broke above previous high
    if (candles[candles.length - 1].high > Math.max(...swingHighs)) broken = true
  } else if (bearish) {
    trend = 'BEARISH'
    // BOS = price broke below previous low
    if (candles[candles.length - 1].low < Math.min(...swingLows)) broken = true
  }

  return {
    trend,
    lastHH: swingHighs[swingHighs.length - 1] || 0,
    lastHL: swingLows[swingLows.length - 1] || 0,
    lastLH: swingHighs[swingHighs.length - 1] || 0,
    lastLL: swingLows[swingLows.length - 1] || 0,
    broken,
  }
}

function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = []

  for (let i = 2; i < candles.length; i++) {
    // Bullish OB: bearish candle followed by bullish candle that engulfs
    if (candles[i - 1].close < candles[i - 1].open && // bearish
        candles[i].close > candles[i].open && // bullish
        candles[i].close > candles[i - 1].high) { // engulfs

      // Check for liquidity sweep below
      const prevLow = candles.slice(Math.max(0, i - 5), i).reduce((min, c) => Math.min(min, c.low), Infinity)
      const swept = candles[i - 1].low < prevLow

      blocks.push({
        type: 'BULLISH',
        startIndex: i - 1,
        endIndex: i,
        price: candles[i - 1].high,
        strength: swept ? 80 : 50,
      })
    }

    // Bearish OB: bullish candle followed by bearish candle that engulfs
    if (candles[i - 1].close > candles[i - 1].open && // bullish
        candles[i].close < candles[i].open && // bearish
        candles[i].close < candles[i - 1].low) { // engulfs

      const prevHigh = candles.slice(Math.max(0, i - 5), i).reduce((max, c) => Math.max(max, c.high), -Infinity)
      const swept = candles[i - 1].high > prevHigh

      blocks.push({
        type: 'BEARISH',
        startIndex: i - 1,
        endIndex: i,
        price: candles[i - 1].low,
        strength: swept ? 80 : 50,
      })
    }
  }

  return blocks
}

function detectFVG(candles: Candle[]): FVG[] {
  const fvgs: FVG[] = []

  for (let i = 1; i < candles.length - 1; i++) {
    // Bullish FVG: current high < next low (gap up)
    if (candles[i].high < candles[i + 1].low) {
      fvgs.push({
        type: 'BULLISH',
        index: i,
        gapHigh: candles[i + 1].low,
        gapLow: candles[i].high,
        size: (candles[i + 1].low - candles[i].high) * 100,
      })
    }

    // Bearish FVG: current low > next high (gap down)
    if (candles[i].low > candles[i + 1].high) {
      fvgs.push({
        type: 'BEARISH',
        index: i,
        gapHigh: candles[i].low,
        gapLow: candles[i + 1].high,
        size: (candles[i].low - candles[i + 1].high) * 100,
      })
    }
  }

  return fvgs
}

function detectLiquidityZones(candles: Candle[], structure: MarketStructure): LiquidityZone[] {
  const zones: LiquidityZone[] = []

  // Buy-side liquidity: above recent highs
  const recentHighs = candles.slice(-20).map(c => c.high)
  const buySidePrice = Math.max(...recentHighs)
  zones.push({ type: 'BUY_SIDE', price: buySidePrice, index: candles.length - 1, swept: false })

  // Sell-side liquidity: below recent lows
  const recentLows = candles.slice(-20).map(c => c.low)
  const sellSidePrice = Math.min(...recentLows)
  zones.push({ type: 'SELL_SIDE', price: sellSidePrice, index: candles.length - 1, swept: false })

  return zones
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: SMC detection module (Order Block, FVG, Liquidity, MSB)"
```

---

### Task 2: Wyckoff + Multi-TF Analysis Module

**Files:**
- Create: `lib/analysis/wyckoff.ts`
- Create: `lib/analysis/mta.ts`

- [ ] **Step 1: Write Wyckoff analysis**

Write to `lib/analysis/wyckoff.ts`:

```typescript
import { Candle, WyckoffResult } from './types'

export function detectWyckoff(candles: Candle[]): WyckoffResult {
  if (candles.length < 50) {
    return { phase: 'UNKNOWN', spring: false, upthrust: false, volumeConfirmation: false, score: 50 }
  }

  const recent = candles.slice(-30)
  const mid = candles.slice(-60, -30)

  // Calculate volume trend
  const avgVolRecent = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length
  const avgVolMid = mid.reduce((sum, c) => sum + c.volume, 0) / mid.length
  const volumeIncreasing = avgVolRecent > avgVolMid * 1.1

  // Price action
  const priceChange = recent[recent.length - 1].close - recent[0].close
  const priceRange = Math.max(...recent.map(c => c.high)) - Math.min(...recent.map(c => c.low))

  // Spring: price breaks below support then closes back above (with volume)
  let spring = false
  const supportLevel = Math.min(...mid.map(c => c.low))
  const springCandle = recent.find(c => c.low < supportLevel && c.close > supportLevel)
  if (springCandle && springCandle.volume > avgVolMid * 1.5) spring = true

  // Upthrust: price breaks above resistance then closes back below (with volume)
  let upthrust = false
  const resistanceLevel = Math.max(...mid.map(c => c.high))
  const upthrustCandle = recent.find(c => c.high > resistanceLevel && c.close < resistanceLevel)
  if (upthrustCandle && upthrustCandle.volume > avgVolMid * 1.5) upthrust = true

  // Phase detection
  let phase: WyckoffResult['phase'] = 'UNKNOWN'

  if (spring || (priceChange > 0 && volumeIncreasing && priceRange < priceRange * 1.1)) {
    phase = 'ACCUMULATION'
  } else if (upthrust || (priceChange < 0 && volumeIncreasing && priceRange < priceRange * 1.1)) {
    phase = 'DISTRIBUTION'
  } else if (priceChange > 0 && priceRange > 0) {
    phase = 'MARKUP'
  } else if (priceChange < 0 && priceRange > 0) {
    phase = 'MARKDOWN'
  }

  // Score
  let score = 50
  if (['ACCUMULATION', 'MARKUP'].includes(phase)) score += 20
  if (spring) score += 15
  if (upthrust) score += 15
  if (volumeIncreasing) score += 10

  return {
    phase,
    spring,
    upthrust,
    volumeConfirmation: volumeIncreasing,
    score: Math.min(score, 100),
  }
}
```

- [ ] **Step 2: Write Multi-TF analysis**

Write to `lib/analysis/mta.ts`:

```typescript
import { Candle, MTAResult } from './types'

export function analyzeMultiTF(candlesM15: Candle[], candlesH1: Candle[], candlesH4: Candle[], candlesD1: Candle[]): MTAResult {
  const d1 = getTrend(candlesD1)
  const h4 = getTrend(candlesH4)
  const h1 = getTrend(candlesH1)
  const m15 = getTrend(candlesM15)

  const alignments = [d1.alignment, h4.alignment, h1.alignment, m15.alignment]
  const bullishCount = alignments.filter(a => a === 'BULLISH').length
  const bearishCount = alignments.filter(a => a === 'BEARISH').length
  const maxAlignment = Math.max(bullishCount, bearishCount)
  const score = (maxAlignment / 4) * 100

  return { d1, h4, h1, m15, score }
}

function getTrend(candles: Candle[]): { trend: string; alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
  if (candles.length < 20) return { trend: 'neutral', alignment: 'NEUTRAL' }

  const closes = candles.map(c => c.close)
  const sma20 = closes.reduce((sum, c) => sum + c, 0) / closes.length
  const lastPrice = closes[closes.length - 1]

  // Trend detection
  const sma50 = closes.slice(-50).length === 50
    ? closes.slice(-50).reduce((sum, c) => sum + c, 0) / 50
    : sma20

  let alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'

  if (lastPrice > sma20 && sma20 > sma50) {
    alignment = 'BULLISH'
  } else if (lastPrice < sma20 && sma20 < sma50) {
    alignment = 'BEARISH'
  }

  const trend = alignment === 'BULLISH' ? 'uptrend' : alignment === 'BEARISH' ? 'downtrend' : 'ranging'

  // Check for momentum
  const recentCloses = closes.slice(-5)
  const momentum = recentCloses[recentCloses.length - 1] - recentCloses[0]

  return { trend: `${trend} (mom: ${momentum > 0 ? '+' : ''}${momentum.toFixed(2)})`, alignment }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Wyckoff + Multi-TF analysis modules"
```

---

### Task 3: Confluence Score + Enhanced LLM Prompt

**Files:**
- Create: `lib/analysis/confluence.ts`
- Create: `lib/analysis/index.ts`
- Modify: `app/api/analyze/route.ts`

- [ ] **Step 1: Write Confluence score**

Write to `lib/analysis/confluence.ts`:

```typescript
import { SMCResult, WyckoffResult, MTAResult } from './types'

const WEIGHTS = {
  smc: 0.30,
  wyckoff: 0.20,
  mta: 0.25,
  indicators: 0.15,
  news: 0.10,
}

export function calculateConfluence(
  smc: SMCResult,
  wyckoff: WyckoffResult,
  mta: MTAResult,
  indicatorScore: number,
  newsScore: number
): { score: number; breakdown: Record<string, number> } {
  const breakdown = {
    smc: smc.score * WEIGHTS.smc,
    wyckoff: wyckoff.score * WEIGHTS.wyckoff,
    mta: mta.score * WEIGHTS.mta,
    indicators: indicatorScore * WEIGHTS.indicators,
    news: newsScore * WEIGHTS.news,
  }

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0)

  return { score: Math.round(score), breakdown }
}

export function getSignalFromConfluence(
  confluence: number,
  smcSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
  mtaAlignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
): 'BUY' | 'SELL' | 'NEUTRAL' {
  if (confluence < 40) return 'NEUTRAL'

  const bullishFactors = [smcSignal === 'BULLISH', mtaAlignment === 'BULLISH']
  const bearishFactors = [smcSignal === 'BEARISH', mtaAlignment === 'BEARISH']

  const bullishCount = bullishFactors.filter(Boolean).length
  const bearishCount = bearishFactors.filter(Boolean).length

  if (bullishCount > bearishCount && confluence >= 60) return 'BUY'
  if (bearishCount > bullishCount && confluence >= 60) return 'SELL'
  return 'NEUTRAL'
}
```

- [ ] **Step 2: Write analysis barrel export**

Write to `lib/analysis/index.ts`:

```typescript
export { detectSMC } from './smc'
export { detectWyckoff } from './wyckoff'
export { analyzeMultiTF } from './mta'
export { calculateConfluence, getSignalFromConfluence } from './confluence'
export type {
  Candle, OrderBlock, FVG, LiquidityZone, MarketStructure, SMCResult,
  WyckoffResult, MTAResult, AnalysisResult,
} from './types'
```

- [ ] **Step 3: Update analyze API route**

Modify `app/api/analyze/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectSMC, detectWyckoff, calculateConfluence, getSignalFromConfluence, analyzeMultiTF, type Candle } from '@/lib/analysis'

export async function POST() {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
  if (!settings?.marketDataApiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 400 })
  }

  // 1. Fetch candles for all timeframes
  const candlesM15 = await fetchCandles(settings, '15min', 100)
  const candlesH1 = await fetchCandles(settings, '1h', 100)
  const candlesH4 = await fetchCandles(settings, '4h', 80)
  const candlesD1 = await fetchCandles(settings, '1day', 50)

  if (!candlesM15 || candlesM15.length === 0) {
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 502 })
  }

  // 2. Run all analysis
  const smc15 = detectSMC(candlesM15)
  const wyckoff = detectWyckoff(candlesM15)
  const mta = analyzeMultiTF(candlesM15, candlesH1, candlesH4, candlesD1)

  // 3. Calculate confluence
  const indicatorScore = 50 + (smc15.score - 50) * 0.5 // weighted
  const newsScore = 80 // optimistic default (no news = safe)
  const { score: confluence, breakdown } = calculateConfluence(smc15, wyckoff, mta, indicatorScore, newsScore)

  // 4. Build expert prompt for LLM
  const expertPrompt = buildExpertPrompt(candlesM15, candlesH1, candlesH4, smc15, wyckoff, mta, confluence)

  let signalData: any

  if (settings.llmApiKey) {
    const llmResult = await callLLM(settings, expertPrompt)
    if (llmResult) {
      try {
        const parsed = JSON.parse(llmResult)
        signalData = {
          ...parsed,
          confidence: Math.min(parsed.confidence || confluence, 100),
        }
      } catch {
        signalData = null
      }
    }
  }

  if (!signalData) {
    // Fallback to rule-based signal
    const smcSignal = smc15.score > 60 ? (smc15.structure.trend === 'BULLISH' ? 'BULLISH' : 'BEARISH') : 'NEUTRAL'
    const signal = getSignalFromConfluence(confluence, smcSignal, mta.d1.alignment)
    const lastPrice = candlesM15[candlesM15.length - 1].close

    signalData = {
      type: signal,
      entry: Math.round(lastPrice * 100) / 100,
      takeProfit: signal === 'BUY'
        ? Math.round((lastPrice + 20) * 100) / 100
        : Math.round((lastPrice - 20) * 100) / 100,
      stopLoss: signal === 'BUY'
        ? Math.round((lastPrice - 15) * 100) / 100
        : Math.round((lastPrice + 15) * 100) / 100,
      confidence: confluence,
      reasoning: `SMC:${smc15.score}% Wyckoff:${wyckoff.phase} MTA:${mta.score}%`,
    }
  }

  // 5. Save signal
  const signal = await prisma.signal.create({
    data: {
      type: signalData.type,
      timeframe: 'H1',
      entry: signalData.entry,
      takeProfit: signalData.takeProfit,
      stopLoss: signalData.stopLoss,
      confidence: signalData.confidence,
      confluence,
      reasoning: signalData.reasoning || '',
      analysis: JSON.stringify({
        smc: { score: smc15.score, structure: smc15.structure.trend, orderBlocks: smc15.orderBlocks.length, fvgs: smc15.fvgs.length },
        wyckoff: { phase: wyckoff.phase, spring: wyckoff.spring, upthrust: wyckoff.upthrust },
        mta: { score: mta.score, d1: mta.d1.alignment },
        confluence: { score: confluence, breakdown },
      }),
    },
  })

  return NextResponse.json(signal)
}

async function fetchCandles(settings: any, interval: string, outputSize: number): Promise<Candle[]> {
  const apiKey = settings.marketDataApiKey
  const provider = settings.marketDataProvider

  const url = provider === 'twelvedata'
    ? `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`
    : `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=${interval === '1day' ? 'daily' : interval}&outputsize=${outputSize}&apikey=${apiKey}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const data = await res.json()

    if (data.values) {
      return data.values.map((v: any) => ({
        time: new Date(v.datetime).getTime() / 1000,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume) || 1000,
      })).reverse()
    }

    if (data['Time Series FX (15min)']) {
      return Object.entries(data['Time Series FX (15min)']).map(([time, v]: any) => ({
        time: new Date(time).getTime() / 1000,
        open: parseFloat(v['1. open']),
        high: parseFloat(v['2. high']),
        low: parseFloat(v['3. low']),
        close: parseFloat(v['4. close']),
        volume: parseInt(v['5. volume']) || 1000,
      })).reverse()
    }

    return []
  } catch {
    return []
  }
}

function buildExpertPrompt(candlesM15: Candle[], candlesH1: Candle[], candlesH4: Candle[], smc: any, wyckoff: any, mta: any, confluence: number): string {
  const last = candlesM15[candlesM15.length - 1]
  const prev = candlesM15[candlesM15.length - 2]

  return `You are an expert XAUUSD trader using ICT/SMC + Wyckoff + Multi-Timeframe analysis.

## Price Action
Current: $${last.close.toFixed(2)} | Prev: $${prev.close.toFixed(2)}
H: $${last.high.toFixed(2)} L: $${last.low.toFixed(2)}
15min Range: $${(Math.max(...candlesM15.slice(-20).map(c => c.high)) - Math.min(...candlesM15.slice(-20).map(c => c.low))).toFixed(2)}

## SMC Analysis
Market Structure: ${smc.structure.trend}
Order Blocks: ${smc.orderBlocks.length}
FVG Gaps: ${smc.fvgs.length}
Break of Structure: ${smc.structure.broken}
Score: ${smc.score}/100

## Wyckoff Analysis
Phase: ${wyckoff.phase}
Spring: ${wyckoff.spring} | Upthrust: ${wyckoff.upthrust}
Volume Confirmation: ${wyckoff.volumeConfirmation}
Score: ${wyckoff.score}/100

## Multi-Timeframe
D1: ${mta.d1.alignment} | H4: ${mta.h4.alignment} | H1: ${mta.h1.alignment} | M15: ${mta.m15.alignment}
Alignment Score: ${mta.score}/100

## Confluence Score: ${confluence}/100

## Your Analysis
You are a professional Smart Money Concepts trader. Analyze the data and return ONLY this JSON:
{
  "type": "BUY" | "SELL" | "NEUTRAL",
  "entry": ${last.close.toFixed(0)},
  "takeProfit": number (${wyckoff.phase === 'MARKUP' ? '30-50 pips for markup' : '15-25 pips for ranging'}),
  "stopLoss": number (10-20 pips below/above entry),
  "confidence": number (0-100, based on confluence + your judgment),
  "reasoning": "string (explain in Thai: SMC setup, Wyckoff phase, TF alignment)"
}`
}

async function callLLM(settings: any, prompt: string): Promise<string | null> {
  const apiKey = settings.llmApiKey
  const provider = settings.llmProvider

  const configs: Record<string, any> = {
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: 'google/gemini-2.0-flash-001', messages: [{ role: 'user', content: prompt }], max_tokens: 500 },
      parse: (r: any) => r.choices?.[0]?.message?.content,
    },
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 500 },
      parse: (r: any) => r.choices?.[0]?.message?.content,
    },
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: { model: 'claude-3-5-haiku-20241022', max_tokens: 500, messages: [{ role: 'user', content: prompt }] },
      parse: (r: any) => r.content?.[0]?.text,
    },
  }

  const config = configs[provider]
  if (!config) return null

  try {
    const res = await fetch(config.url, { method: 'POST', headers: config.headers, body: JSON.stringify(config.body), signal: AbortSignal.timeout(30000) })
    const data = await res.json()
    let content = config.parse(data)
    if (content) content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return content
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: confluence score + enhanced LLM prompt with SMC/Wyckoff/MTA context"
```

---

### Task 4: Analysis Visualization on Dashboard

**Files:**
- Create: `components/analysis-panel.tsx`
- Create: `components/confluence-gauge.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write Confluence gauge component**

Write to `components/confluence-gauge.tsx`:

```typescript
'use client'

type Props = {
  score: number
  breakdown?: Record<string, number>
}

export function ConfluenceGauge({ score, breakdown }: Props) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Confluence Score</span>
        <span className="text-lg font-bold" style={{ color }}>
          {score}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {breakdown && (
        <div className="text-xs text-muted-foreground space-y-1 pt-1">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span>{key}</span>
              <span>{Math.round(val)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write Analysis Panel**

Write to `components/analysis-panel.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Analysis = {
  smc: { score: number; structure: string; orderBlocks: number; fvgs: number }
  wyckoff: { phase: string; spring: boolean; upthrust: boolean }
  mta: { score: number; d1: string }
  confluence: { score: number }
}

type Props = {
  analysis: Analysis
}

export function AnalysisPanel({ analysis }: Props) {
  if (!analysis) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Expert Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="flex justify-between mb-1">
            <span>SMC</span>
            <span className="font-mono">{analysis.smc.score}%</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {analysis.smc.structure}
            </Badge>
            <Badge variant="outline" className="text-xs">
              OB: {analysis.smc.orderBlocks}
            </Badge>
            <Badge variant="outline" className="text-xs">
              FVG: {analysis.smc.fvgs}
            </Badge>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Wyckoff</span>
            <span className="font-mono">{analysis.wyckoff.phase}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {analysis.wyckoff.spring && <Badge className="bg-green-500/10 text-green-500 text-xs">Spring</Badge>}
            {analysis.wyckoff.upthrust && <Badge className="bg-red-500/10 text-red-500 text-xs">Upthrust</Badge>}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>MTA</span>
            <span className="font-mono">{analysis.mta.score}%</span>
          </div>
          <Badge variant="outline" className="text-xs">
            D1: {analysis.mta.d1}
          </Badge>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between">
            <span className="font-semibold">Confluence</span>
            <span className={`font-bold text-lg ${
              analysis.confluence.score >= 75 ? 'text-green-500' :
              analysis.confluence.score >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {analysis.confluence.score}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Add analysis panel to dashboard**

Modify `app/page.tsx` - add analysis section to sidebar:

```typescript
import { AnalysisPanel } from '@/components/analysis-panel'
import { ConfluenceGauge } from '@/components/confluence-gauge'

// Add state for latest analysis
const [latestAnalysis, setLatestAnalysis] = useState<any>(null)

// After loadSignals, parse analysis from latest signal
useEffect(() => {
  if (signals.length > 0 && signals[0].analysis) {
    try {
      setLatestAnalysis(JSON.parse(signals[0].analysis))
    } catch {}
  }
}, [signals])
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: analysis visualization panel with confluence gauge"
```
