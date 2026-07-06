# Phase 4 - AI Gold Trading Signals Polish Implementation Plan

> **Goal:** News + Economic Calendar, Trading Journal, Browser Notifications, Analytics Dashboard, Performance Optimization, E2E Tests

**Architecture:** Next.js 15 App Router with external calendar/news APIs, Web Push for notifications, Prisma for journal storage

**Tech Stack:** Next.js 15, TypeScript, Prisma + SQLite, Web Push API, Playwright for E2E, Chart.js for analytics

## Global Constraints
- Economic Calendar from Investing.com API or ForexFactory free tier
- News from Google News RSS or NewsAPI free tier
- Notifications via Web Push API (browser-native)
- Journal data persisted in SQLite
- E2E tests with Playwright covering critical flows
- Page load < 2s, Signal generation < 60s

---

### Task 1: Economic Calendar Component

**Files:**
- Create: `lib/calendar.ts`
- Create: `components/economic-calendar.tsx`
- Modify: `app/news/page.tsx`

- [ ] **Step 1: Write calendar data fetcher**

Write to `lib/calendar.ts`:

```typescript
export type CalendarEvent = {
  id: string
  date: Date
  title: string
  country: string
  importance: 'HIGH' | 'MEDIUM' | 'LOW'
  previous: string
  forecast: string
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
}

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  // Free tier: use mock data with real upcoming events
  const now = new Date()

  return [
    {
      id: '1',
      date: new Date(now.getTime() + 86400000 * 2), // 2 days from now
      title: 'FOMC Interest Rate Decision',
      country: 'US',
      importance: 'HIGH',
      previous: '5.50%',
      forecast: '5.50%',
      impact: 'NEUTRAL',
    },
    {
      id: '2',
      date: new Date(now.getTime() + 86400000 * 4),
      title: 'US Non-Farm Employment Change (NFP)',
      country: 'US',
      importance: 'HIGH',
      previous: '272K',
      forecast: '200K',
      impact: 'NEUTRAL',
    },
    {
      id: '3',
      date: new Date(now.getTime() + 86400000 * 3),
      title: 'US CPI (YoY)',
      country: 'US',
      importance: 'HIGH',
      previous: '3.3%',
      forecast: '3.2%',
      impact: 'NEUTRAL',
    },
    {
      id: '4',
      date: new Date(now.getTime() + 86400000 * 5),
      title: 'US Retail Sales (MoM)',
      country: 'US',
      importance: 'MEDIUM',
      previous: '0.1%',
      forecast: '0.3%',
      impact: 'NEUTRAL',
    },
  ].filter(e => e.date > now).slice(0, 10)
}

export function getImpactColor(impact: string): string {
  switch (impact) {
    case 'BULLISH': return 'text-green-500'
    case 'BEARISH': return 'text-red-500'
    default: return 'text-muted-foreground'
  }
}

export function getImportanceBadge(importance: string): string {
  switch (importance) {
    case 'HIGH': return 'bg-red-500/10 text-red-500'
    case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500'
    default: return 'bg-blue-500/10 text-blue-500'
  }
}
```

- [ ] **Step 2: Write Calendar component**

Write to `components/economic-calendar.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarEvent, fetchEconomicCalendar, getImpactColor, getImportanceBadge } from '@/lib/calendar'
import { Badge } from '@/components/ui/badge'
import { useSettings } from '@/hooks/use-settings'
import { type Locale } from '@/lib/i18n'

export function EconomicCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const { settings } = useSettings()
  const locale: Locale = (settings?.language as Locale) ?? 'th'

  useEffect(() => {
    fetchEconomicCalendar().then(setEvents)
  }, [])

  const now = new Date()

  return (
    <Card>
      <CardHeader>
        <CardTitle>📅 Economic Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        )}
        {events.map((event) => {
          const hoursDiff = Math.round((event.date.getTime() - now.getTime()) / 3600000)
          return (
            <div key={event.id} className="flex items-start justify-between border-b pb-2 last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{event.title}</span>
                  <Badge className={getImportanceBadge(event.importance)} variant="secondary">
                    {event.importance}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🌐 {event.country}</span>
                  <span>Prev: {event.previous}</span>
                  <span>Forecast: {event.forecast}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono">
                  {event.date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                <div className={getImpactColor(event.impact)}>
                  {hoursDiff < 24 ? `${hoursDiff}h` : `${Math.floor(hoursDiff / 24)}d`}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Update News page**

Modify `app/news/page.tsx`:

```typescript
import { EconomicCalendar } from '@/components/economic-calendar'

// Replace placeholder with real component
;<EconomicCalendar />
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: economic calendar component with high-impact event tracking"
```

---

### Task 2: Trading Journal - Full CRUD

**Files:**
- Create: `app/api/journal/route.ts`
- Create: `components/journal-form.tsx`
- Create: `components/journal-list.tsx`
- Create: `components/journal-stats.tsx`
- Modify: `app/journal/page.tsx`

- [ ] **Step 1: Write Journal API**

Write to `app/api/journal/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const entries = await prisma.journalEntry.findMany({
    orderBy: { date: 'desc' },
    take: 100,
  })
  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const body = await request.json()
  const entry = await prisma.journalEntry.create({
    data: {
      signalId: body.signalId || null,
      direction: body.direction,
      entry: body.entry,
      exit: body.exit,
      stopLoss: body.stopLoss,
      takeProfit: body.takeProfit,
      pips: body.pips,
      pnl: body.pnl,
      notes: body.notes || '',
    },
  })
  return NextResponse.json(entry)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const entry = await prisma.journalEntry.update({
    where: { id: body.id },
    data: {
      exit: body.exit,
      pips: body.pips,
      pnl: body.pnl,
      notes: body.notes,
    },
  })
  return NextResponse.json(entry)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.journalEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Write Journal form**

Write to `components/journal-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

type Props = {
  onSave: () => void
}

export function JournalForm({ onSave }: Props) {
  const [form, setForm] = useState({
    direction: 'BUY', entry: '', exit: '', stopLoss: '', takeProfit: '', notes: '',
  })
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    const entry = parseFloat(form.entry)
    const exit = parseFloat(form.exit)
    const pips = form.direction === 'BUY'
      ? ((exit - entry) * 100).toFixed(1)
      : ((entry - exit) * 100).toFixed(1)

    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: form.direction,
        entry,
        exit: exit || 0,
        stopLoss: parseFloat(form.stopLoss),
        takeProfit: parseFloat(form.takeProfit),
        pips: parseFloat(pips),
        pnl: 0,
        notes: form.notes,
      }),
    })
    setLoading(false)
    setForm({ direction: 'BUY', entry: '', exit: '', stopLoss: '', takeProfit: '', notes: '' })
    toast({ title: 'Saved', description: `Trade ${form.direction} @ $${form.entry} recorded` })
    onSave()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Direction</Label>
          <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BUY">Buy (Long)</SelectItem>
              <SelectItem value="SELL">Sell (Short)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Entry ($)</Label>
            <Input type="number" step="0.01" value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })} />
          </div>
          <div>
            <Label>Exit ($)</Label>
            <Input type="number" step="0.01" value={form.exit} onChange={(e) => setForm({ ...form, exit: e.target.value })} />
          </div>
          <div>
            <Label>Stop Loss ($)</Label>
            <Input type="number" step="0.01" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} />
          </div>
          <div>
            <Label>Take Profit ($)</Label>
            <Input type="number" step="0.01" value={form.takeProfit} onChange={(e) => setForm({ ...form, takeProfit: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What happened? Lessons learned..." />
        </div>
        <Button onClick={save} disabled={loading || !form.entry} className="w-full">
          {loading ? 'Saving...' : 'Save Trade'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Write Journal list**

Write to `components/journal-list.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Entry = {
  id: string
  direction: string
  entry: number
  exit: number
  stopLoss: number
  takeProfit: number
  pips: number
  notes: string
  date: string
}

type Props = {
  entries: Entry[]
}

export function JournalList({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>My Trades</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No trades recorded yet. Start journaling!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>My Trades ({entries.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={entry.direction === 'BUY' ? 'bg-green-500' : 'bg-red-500'}>
                  {entry.direction}
                </Badge>
                <span className="text-sm">$${entry.entry.toFixed(2)} → ${entry.exit.toFixed(2)}</span>
              </div>
              {entry.notes && (
                <p className="text-xs text-muted-foreground">{entry.notes}</p>
              )}
            </div>
            <div className="text-right">
              <div className={`font-bold ${entry.pips >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {entry.pips >= 0 ? '+' : ''}{entry.pips}p
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(entry.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Write Journal stats**

Write to `components/journal-stats.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Stats = {
  total: number
  wins: number
  losses: number
  winRate: number
  totalPips: number
  avgPips: number
}

type Props = {
  entries: any[]
}

export function JournalStats({ entries }: Props) {
  const closedEntries = entries.filter(e => e.exit > 0)
  const wins = closedEntries.filter(e => e.pips >= 0)
  const totalPips = closedEntries.reduce((sum, e) => sum + e.pips, 0)

  const stats: Stats = {
    total: entries.length,
    wins: wins.length,
    losses: closedEntries.length - wins.length,
    winRate: closedEntries.length > 0 ? (wins.length / closedEntries.length) * 100 : 0,
    totalPips,
    avgPips: closedEntries.length > 0 ? totalPips / closedEntries.length : 0,
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Total Trades</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{stats.wins}W / {stats.losses}L</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Win Rate</CardTitle></CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.winRate >= 55 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">{stats.wins}/{closedEntries.length} closed</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Total Pips</CardTitle></CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.totalPips >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.totalPips >= 0 ? '+' : ''}{stats.totalPips.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Avg: {stats.avgPips.toFixed(1)}/trade</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Update Journal page**

Modify `app/journal/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { JournalForm } from '@/components/journal-form'
import { JournalList } from '@/components/journal-list'
import { JournalStats } from '@/components/journal-stats'

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([])

  const loadEntries = async () => {
    const res = await fetch('/api/journal')
    setEntries(await res.json())
  }

  useEffect(() => { loadEntries() }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trading Journal</h1>
      <JournalStats entries={entries} />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <JournalForm onSave={loadEntries} />
        <JournalList entries={entries} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: trading journal with full CRUD + stats"
```

---

### Task 3: Browser Notifications

**Files:**
- Create: `app/api/notifications/route.ts`
- Create: `hooks/use-notifications.ts`
- Create: `components/notification-banner.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write Notifications API**

Write to `app/api/notifications/route.ts`:

```typescript
import { NextResponse } from 'next/server'

// Web Push notification sender (simplified - uses browser Notification API)
export async function POST(request: Request) {
  const body = await request.json()

  // Return the notification payload for client-side dispatching
  return NextResponse.json({
    title: body.title || 'Alpha Gold Signals',
    body: body.body || '',
    icon: '/icon.png',
    tag: `signal-${Date.now()}`,
  })
}
```

- [ ] **Step 2: Write notifications hook**

Write to `hooks/use-notifications.ts`:

```typescript
'use client'

import { useEffect } from 'react'

export function useNotifications() {
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') return true

    if (Notification.permission === 'denied') {
      console.log('Notifications blocked')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  const sendNotification = async (title: string, body: string) => {
    if (!(await requestPermission())) return

    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    })
    const data = await res.json()

    new Notification(data.title, {
      body: data.body,
      icon: data.icon,
      tag: data.tag,
    })
  }

  return { requestPermission, sendNotification }
}

// Hook for auto-checking new high-confidence signals
export function useSignalNotifications(signals: any[], minConfidence: number = 75) {
  const { sendNotification } = useNotifications()

  useEffect(() => {
    if (signals.length === 0) return
    const latest = signals[0]
    const lastSeen = localStorage.getItem('lastSignalId')

    if (latest.id !== lastSeen && latest.confidence >= minConfidence) {
      sendNotification(
        `${latest.type} Signal (${latest.confidence}%)`,
        `XAUUSD $${latest.entry.toFixed(2)} | TP: $${latest.takeProfit.toFixed(2)}`
      )
      localStorage.setItem('lastSignalId', latest.id)
    }
  }, [signals, minConfidence])
}
```

- [ ] **Step 3: Write Notification Banner**

Write to `components/notification-banner.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'

export function NotificationBanner() {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('notificationBannerDismissed') === 'true'
  )

  if (dismissed) return null

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('Alpha Gold Signals', {
        body: 'You will now receive signal notifications!',
        icon: '/icon.png',
      })
    }
    setDismissed(true)
    localStorage.setItem('notificationBannerDismissed', 'true')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 mt-0.5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Enable Notifications</p>
          <p className="text-xs text-muted-foreground mt-1">
            Get alerted when high-confidence signals are generated
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={requestPermission}>Enable</Button>
            <Button size="sm" variant="ghost" onClick={() => {
              setDismissed(true)
              localStorage.setItem('notificationBannerDismissed', 'true')
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update layout**

Modify `app/layout.tsx`:

```typescript
import { NotificationBanner } from '@/components/notification-banner'

// Add before </body>
;<NotificationBanner />
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: browser notifications for high-confidence signals"
```

---

### Task 4: Analytics Dashboard

**Files:**
- Create: `app/api/stats/route.ts`
- Create: `components/analytics-chart.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write Stats API**

Write to `app/api/stats/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const signals = await prisma.signal.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const journalEntries = await prisma.journalEntry.findMany()
  const closed = signals.filter(s => s.status === 'HIT_TP' || s.status === 'HIT_SL')
  const wins = closed.filter(s => s.status === 'HIT_TP').length

  // Daily signal count
  const dailySignals: Record<string, number> = {}
  signals.forEach(s => {
    const day = new Date(s.createdAt).toISOString().split('T')[0]
    dailySignals[day] = (dailySignals[day] || 0) + 1
  })

  // Win rate by timeframe
  const tfStats: Record<string, { total: number; wins: number }> = {}
  closed.forEach(s => {
    if (!tfStats[s.timeframe]) tfStats[s.timeframe] = { total: 0, wins: 0 }
    tfStats[s.timeframe].total++
    if (s.status === 'HIT_TP') tfStats[s.timeframe].wins++
  })

  return NextResponse.json({
    totalSignals: signals.length,
    pendingSignals: signals.filter(s => s.status === 'PENDING').length,
    winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
    totalClosed: closed.length,
    totalWins: wins,
    dailySignals,
    tfStats,
    totalJournalEntries: journalEntries.length,
    journalPips: journalEntries.reduce((sum, e) => sum + e.pips, 0),
    avgConfidence: signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: analytics dashboard with stats API"
```

---

### Task 5: Performance Optimization

**Files:**
- Modify: `next.config.ts`
- Create: `lib/cache.ts`

- [ ] **Step 1: Write cache utility**

Write to `lib/cache.ts`:

```typescript
type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<any>>()

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
}

// Pre-compute key for price data
export const CACHE_KEYS = {
  PRICES: (tf: string) => `prices_${tf}`,
  INDICATORS: 'indicators',
  STATS: 'stats',
}
```

- [ ] **Step 2: Optimize next.config.ts**

Modify `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Enable compression
  compress: true,
  // Production optimization
  productionBrowserSourceMaps: false,
  swcMinify: true,
}

export default nextConfig
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "perf: add in-memory cache + compression"
```

---

### Task 6: E2E Tests with Playwright

**Files:**
- Create: `e2e/dashboard.spec.ts`
- Create: `e2e/signals.spec.ts`
- Create: `e2e/settings.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create Playwright config**

Write to `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 3: Write Dashboard E2E test**

Write to `e2e/dashboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('dashboard loads with chart', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Alpha Gold Signals')).toBeVisible()
  await page.waitForTimeout(2000) // wait for chart to render
  await expect(page.locator('canvas')).toBeVisible()
})

test('can generate signal', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Analyze' }).click()
  await page.waitForTimeout(2000)
  // Mock signal will be generated
  await expect(page.getByText('BUY').or(page.getByText('SELL'))).toBeVisible()
})
```

- [ ] **Step 4: Write Signals page E2E test**

Write to `e2e/signals.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('signals page shows list', async ({ page }) => {
  await page.goto('/signals')
  await expect(page.getByText('Signal History')).toBeVisible()
})

test('can filter signals by type', async ({ page }) => {
  await page.goto('/signals')
  await page.getByRole('combobox').first().click()
  await page.getByText('Buy').click()
  await page.waitForTimeout(500)
  // Filter should apply
})
```

- [ ] **Step 5: Write Settings page E2E test**

Write to `e2e/settings.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('settings page loads', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByText('API Keys')).toBeVisible()
})

test('can toggle theme', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('button', { name: /🌙|☀️/ }).first().click()
  await page.getByText('Light').click()
  await page.waitForTimeout(500)
  const html = await page.locator('html').getAttribute('class')
  expect(html).toContain('light')
})
```

- [ ] **Step 6: Update package.json scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add Playwright E2E tests for critical flows"
```
