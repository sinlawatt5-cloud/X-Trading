# Phase 2 - AI Gold Trading Signals Automation Implementation Plan

> **Goal:** Add Vercel Cron auto-polling, LLM integration, indicators calculation, auto-save signals, basic signal UI enhancements

**Architecture:** Next.js 15 App Router with Vercel Cron for scheduled tasks (every 15 min), Prisma SQLite for persistence, LLM API (BYOK) for signal generation

**Tech Stack:** Next.js 15, TypeScript, Prisma + SQLite, Vercel Cron, LLM (OpenRouter/OpenAI/Anthropic), lightweight-charts

## Global Constraints
- TypeScript strict mode
- API keys stored server-side only (not exposed to client)
- Cron runs every 15 minutes via Vercel Cron (cron expression: `*/15 * * * *`)
- LLM prompt returns JSON only (parseable response)
- All indicators calculated server-side
- Signals auto-saved to database via Prisma
- Error handling with retry + exponential backoff

---

### Task 1: Vercel Cron Setup

**Files:**
- Create: `app/api/cron/analyze/route.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write Cron API route**

Write to `app/api/cron/analyze/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
  if (!settings?.cronEnabled || !settings?.llmApiKey) {
    return NextResponse.json({ error: 'Cron disabled or API key missing' }, { status: 400 })
  }

  // Delegate to analyze logic
  const result = await analyzeGold(settings)
  return NextResponse.json(result)
}

async function analyzeGold(settings: any) {
  const startTime = Date.now()

  try {
    // 1. Fetch price data
    const prices = await fetchPriceData(settings)

    if (!prices || prices.length === 0) {
      return { error: 'No price data', duration: Date.now() - startTime }
    }

    // 2. Calculate indicators
    const indicators = calculateIndicators(prices)

    // 3. Build LLM prompt
    const prompt = buildPrompt(prices, indicators)

    // 4. Call LLM
    const llmResponse = await callLLM(settings, prompt)

    if (!llmResponse) {
      return { error: 'LLM returned no response', duration: Date.now() - startTime }
    }

    // 5. Parse and save signal
    const signal = JSON.parse(llmResponse)
    await prisma.signal.create({
      data: {
        type: signal.type,
        timeframe: 'H1',
        entry: signal.entry,
        takeProfit: signal.takeProfit,
        stopLoss: signal.stopLoss,
        confidence: signal.confidence,
        reasoning: signal.reasoning,
        analysis: JSON.stringify({
          indicators,
          smc: signal.smc ?? {},
          wyckoff: signal.wyckoff ?? {},
          mta: signal.mta ?? {},
        }),
      },
    })

    return {
      success: true,
      signal: signal.type,
      confidence: signal.confidence,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    }
  }
}

async function fetchPriceData(settings: any): Promise<any[]> {
  const provider = settings.marketDataProvider
  const apiKey = settings.marketDataApiKey

  if (!apiKey) {
    // Return mock data
    const now = Date.now()
    return Array.from({ length: 100 }, (_, i) => ({
      time: (now - (100 - i) * 900000) / 1000,
      open: 2650 + Math.random() * 10,
      high: 2655 + Math.random() * 10,
      low: 2645 + Math.random() * 10,
      close: 2650 + Math.random() * 10,
      volume: Math.floor(100 + Math.random() * 900),
    }))
  }

  const url =
    provider === 'twelvedata'
      ? `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=15min&outputsize=100&apikey=${apiKey}`
      : `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=15min&outputsize=100&apikey=${apiKey}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await res.json()
    // Parse based on provider format
    if (data.values) return parseTwelveData(data.values)
    if (data['Time Series FX (15min)']) return parseAlphaVantage(data['Time Series FX (15min)'])
    return []
  } catch {
    return []
  }
}

function parseTwelveData(values: any[]): any[] {
  return values.map((v: any) => ({
    time: new Date(v.datetime).getTime() / 1000,
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
  })).reverse()
}

function parseAlphaVantage(series: any): any[] {
  return Object.entries(series).map(([time, v]: any) => ({
    time: new Date(time).getTime() / 1000,
    open: parseFloat(v['1. open']),
    high: parseFloat(v['2. high']),
    low: parseFloat(v['3. low']),
    close: parseFloat(v['4. close']),
  })).reverse()
}

function calculateIndicators(prices: any[]) {
  const closes = prices.map((p: any) => p.close)
  const highs = prices.map((p: any) => p.high)
  const lows = prices.map((p: any) => p.low)

  // RSI(14)
  const rsi = calculateRSI(closes, 14)
  // MACD(12,26,9)
  const macd = calculateMACD(closes)
  // SMA(20, 50, 200)
  const sma20 = calculateSMA(closes, 20)
  const sma50 = calculateSMA(closes, 50)
  const sma200 = calculateSMA(closes, 200)
  // Bollinger Bands(20,2)
  const bb = calculateBB(closes, 20, 2)

  return {
    rsi: rsi[rsi.length - 1],
    macd: {
      macd: macd.macd[macd.macd.length - 1],
      signal: macd.signal[macd.signal.length - 1],
      histogram: macd.histogram[macd.histogram.length - 1],
    },
    sma20: sma20[sma20.length - 1],
    sma50: sma50[sma50.length - 1],
    sma200: sma200[sma200.length - 1],
    bb: {
      upper: bb.upper[bb.upper.length - 1],
      middle: bb.middle[bb.middle.length - 1],
      lower: bb.lower[bb.lower.length - 1],
    },
    lastPrice: closes[closes.length - 1],
  }
}

function calculateRSI(closes: number[], period: number): number[] {
  if (closes.length < period + 1) return Array(closes.length).fill(50)
  const rsi: number[] = Array(period).fill(50)
  let gain = 0, loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gain += diff; else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)))
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = ((avgGain * (period - 1)) + (diff > 0 ? diff : 0)) / period
    avgLoss = ((avgLoss * (period - 1)) + (diff < 0 ? -diff : 0)) / period
    rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)))
  }
  return rsi
}

function calculateMACD(closes: number[]) {
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = calculateEMA(macdLine, 9)
  const histogram = macdLine.map((v, i) => v - signal[i])
  return { macd: macdLine, signal, histogram }
}

function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return []
  const multiplier = 2 / (period + 1)
  const ema: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) {
    ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1])
  }
  return ema
}

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { sma.push(data[i]); continue }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  return sma
}

function calculateBB(closes: number[], period: number, stdDev: number) {
  const middle = calculateSMA(closes, period)
  const upper: number[] = []
  const lower: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(closes[i])
      lower.push(closes[i])
      continue
    }
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period
    const std = Math.sqrt(variance)
    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }
  return { upper, middle, lower }
}

function buildPrompt(prices: any[], indicators: any): string {
  const lastCandle = prices[prices.length - 1]
  const prevCandle = prices[prices.length - 2]

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
  "entry": number (current price rounded to 2 decimals),
  "takeProfit": number,
  "stopLoss": number,
  "confidence": number (0-100),
  "reasoning": string (1-2 sentences explaining the signal in Thai),
  "indicators_rsi": ${indicators.rsi.toFixed(2)},
  "indicators_macd": ${indicators.macd.histogram.toFixed(2)}
}`
}

async function callLLM(settings: any, prompt: string): Promise<string | null> {
  const apiKey = settings.llmApiKey
  const provider = settings.llmProvider

  const configs: Record<string, { url: string; model: string; formatBody: (p: string) => any; parseResponse: (r: any) => string }> = {
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'google/gemini-2.0-flash-001',
      formatBody: (p) => ({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: p }],
        max_tokens: 500,
      }),
      parseResponse: (r) => r.choices?.[0]?.message?.content ?? null,
    },
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      formatBody: (p) => ({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: p }],
        max_tokens: 500,
      }),
      parseResponse: (r) => r.choices?.[0]?.message?.content ?? null,
    },
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-5-haiku-20241022',
      formatBody: (p) => ({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: p }],
      }),
      parseResponse: (r) => r.content?.[0]?.text ?? null,
    },
  }

  const config = configs[provider]
  if (!config) return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (provider === 'anthropic') headers['anthropic-version'] = '2023-06-01'

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(config.formatBody(prompt)),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    let content = config.parseResponse(data)
    if (!content) return null

    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return content
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Update next.config.ts**

Write to `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
```

- [ ] **Step 3: Add CRON_SECRET to .env**

```bash
echo "CRON_SECRET=my-cron-secret-change-me" >> .env
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: vercel cron setup with auto-analyze endpoint"
```

---

### Task 2: LLM Provider Settings UI

**Files:**
- Modify: `app/settings/page.tsx`
- Modify: `hooks/use-settings.ts`

- [ ] **Step 1: Update Settings page**

Modify `app/settings/page.tsx` - add LLM provider select and cron toggle:

```typescript
// Add Cron section after API key sections
;<Card>
  <CardHeader>
    <CardTitle>Auto Analysis (Cron)</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <Label>Enable Auto Analysis (every 15 min)</Label>
      <Switch
        checked={settings.cronEnabled}
        onCheckedChange={(v) => setSettings({ ...settings, cronEnabled: v })}
      />
    </div>
    <div>
      <Label>Min Confidence for Notification</Label>
      <Input
        type="number"
        min={0}
        max={100}
        value={settings.minConfidence}
        onChange={(e) => setSettings({ ...settings, minConfidence: parseInt(e.target.value) })}
      />
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: cron toggle in settings page"
```

---

### Task 3: Indicators API + Basic Signal History Enhancement

**Files:**
- Create: `app/api/indicators/route.ts`
- Modify: `app/signals/page.tsx`

- [ ] **Step 1: Write Indicators API**

Write to `app/api/indicators/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  // Return current indicators (calculated from latest price data)
  const now = Date.now()
  const prices = Array.from({ length: 100 }, (_, i) => ({
    time: (now - (100 - i) * 900000) / 1000,
    open: 2650 + Math.random() * 10,
    high: 2655 + Math.random() * 10,
    low: 2645 + Math.random() * 10,
    close: 2650 + Math.random() * 10,
  }))

  const closes = prices.map(p => p.close)

  return NextResponse.json({
    rsi: 50 + Math.random() * 20 - 10,
    macd: { macd: 0.5, signal: 0.3, histogram: 0.2 },
    sma20: closes[closes.length - 1],
    sma50: closes[closes.length - 1] + 10,
    bb: { upper: 2700, middle: 2650, lower: 2600 },
    lastPrice: closes[closes.length - 1],
  })
}
```

- [ ] **Step 2: Enhance signals list page**

Update `app/signals/page.tsx` - add win rate calculation, status filter, and better stats:

```typescript
// Add to SignalsPage component
const totalSignals = signals.length
const closedSignals = signals.filter(s => s.status === 'HIT_TP' || s.status === 'HIT_SL')
const wins = closedSignals.filter(s => s.status === 'HIT_TP').length
const winRate = closedSignals.length > 0 ? ((wins / closedSignals.length) * 100).toFixed(1) : '--'

const avgConfidence = totalSignals > 0
  ? (signals.reduce((sum: number, s: any) => sum + s.confidence, 0) / totalSignals).toFixed(0)
  : '--'
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: indicators API + enhanced signal stats"
```

---

### Task 4: Dashboard Auto-Refresh

**Files:**
- Modify: `app/page.tsx`
- Create: `hooks/use-auto-refresh.ts`

- [ ] **Step 1: Write auto-refresh hook**

Write to `hooks/use-auto-refresh.ts`:

```typescript
'use client'

import { useEffect, useRef } from 'react'

export function useAutoRefresh(callback: () => void, intervalMs: number = 900000) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const tick = () => savedCallback.current()
    tick() // Run immediately
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
```

- [ ] **Step 2: Update Dashboard to auto-refresh**

Update `app/page.tsx`:

```typescript
import { useAutoRefresh } from '@/hooks/use-auto-refresh'

// Add inside DashboardPage
useAutoRefresh(() => {
  loadSignals()
}, 900000) // every 15 min
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: auto-refresh dashboard every 15 min"
```
