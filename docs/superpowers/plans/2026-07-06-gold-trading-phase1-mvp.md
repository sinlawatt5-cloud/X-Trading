# Phase 1 - AI Gold Trading Signals MVP Implementation Plan

> **Goal:** Scaffold Next.js project, DB, Chart, Settings page, manual signal generation, signals list, i18n

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma + SQLite, lightweight-charts, next-intl

## Global Constraints
- TypeScript strict mode
- Tailwind CSS for styling, shadcn/ui for components
- Prisma ORM with SQLite
- i18n with next-intl (th/en)
- All API keys stored server-side (encrypted)
- Uses `app/` directory routing

---

### Task 1: Scaffold Next.js + shadcn/ui + Prisma

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest gold-trading-signals --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd gold-trading-signals
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client light-weight-charts next-intl zod
npm install -D @types/node
```

- [ ] **Step 3: Init shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input select badge toast dropdown-menu
```

- [ ] **Step 4: Init Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 5: Create Prisma schema**

Write to `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Signal {
  id          String   @id @default(cuid())
  type        String   // BUY | SELL | NEUTRAL
  timeframe   String   // M15 | H1 | H4
  entry       Float
  takeProfit  Float
  stopLoss    Float
  confidence  Int
  confluence  Int      @default(0)
  reasoning   String
  analysis    String   @default("{}") // JSON string
  status      String   @default("PENDING") // PENDING | HIT_TP | HIT_SL | EXPIRED
  createdAt   DateTime @default(now())
  closedAt    DateTime?
}

model JournalEntry {
  id        String   @id @default(cuid())
  signalId  String?
  date      DateTime @default(now())
  symbol    String   @default("XAUUSD")
  direction String   // BUY | SELL
  entry     Float
  exit      Float
  stopLoss  Float
  takeProfit Float
  pips      Float
  pnl       Float
  notes     String   @default("")
  screenshot String?

  signal    Signal?  @relation(fields: [signalId], references: [id])
}

model Settings {
  id               String @id @default("default")
  llmProvider      String @default("openrouter")
  llmApiKey        String @default("")
  marketDataProvider String @default("twelvedata")
  marketDataApiKey String @default("")
  language         String @default("th")
  theme            String @default("dark")
  cronEnabled      Boolean @default(false)
  cronInterval     Int    @default(15)
  minConfidence    Int    @default(75)
}
```

- [ ] **Step 6: Run migration**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

- [ ] **Step 7: Create Prisma client helper**

Write to `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 8: Create .env**

Write to `.env`:

```
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js + shadcn/ui + Prisma + SQLite"
```

---

### Task 2: Layout + Theme + i18n Setup

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `lib/i18n.ts`
- Create: `messages/th.json`
- Create: `messages/en.json`
- Create: `components/theme-provider.tsx`
- Create: `components/header.tsx`

- [ ] **Step 1: Write i18n setup**

Write to `lib/i18n.ts`:

```typescript
export type Locale = 'th' | 'en'

export const defaultLocale: Locale = 'th'

export const translations: Record<Locale, Record<string, string>> = {
  th: {
    'app.name': 'Alpha Gold Signals',
    'nav.dashboard': 'แดชบอร์ด',
    'nav.signals': 'สัญญาณ',
    'nav.news': 'ข่าวสาร',
    'nav.journal': 'บันทึกเทรด',
    'nav.settings': 'ตั้งค่า',
    'signal.buy': 'ซื้อ',
    'signal.sell': 'ขาย',
    'signal.neutral': 'รอดู',
    'signal.pending': 'รอผล',
    'signal.hit_tp': 'ถึง TP',
    'signal.hit_sl': 'ถึง SL',
    'signal.expired': 'หมดอายุ',
    'settings.api_keys': 'คีย์ API',
    'settings.llm': 'LLM',
    'settings.market': 'ข้อมูลตลาด',
    'settings.language': 'ภาษา',
    'settings.theme': 'ธีม',
    'chart.title': 'กราฟ XAUUSD',
    'signal.generate': 'วิเคราะห์สัญญาณ',
    'signal.history': 'ประวัติสัญญาณ',
    'signal.winrate': 'อัตราชนะ',
  },
  en: {
    'app.name': 'Alpha Gold Signals',
    'nav.dashboard': 'Dashboard',
    'nav.signals': 'Signals',
    'nav.news': 'News',
    'nav.journal': 'Journal',
    'nav.settings': 'Settings',
    'signal.buy': 'Buy',
    'signal.sell': 'Sell',
    'signal.neutral': 'Neutral',
    'signal.pending': 'Pending',
    'signal.hit_tp': 'Hit TP',
    'signal.hit_sl': 'Hit SL',
    'signal.expired': 'Expired',
    'settings.api_keys': 'API Keys',
    'settings.llm': 'LLM',
    'settings.market': 'Market Data',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'chart.title': 'XAUUSD Chart',
    'signal.generate': 'Analyze Signal',
    'signal.history': 'Signal History',
    'signal.winrate': 'Win Rate',
  },
}

export function t(key: string, locale: Locale): string {
  return translations[locale]?.[key] ?? key
}
```

- [ ] **Step 2: Create theme provider**

Write to `components/theme-provider.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.add(mq.matches ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

- [ ] **Step 3: Create Header component**

Write to `components/header.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'
import { useTheme } from './theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSettings } from '@/hooks/use-settings'

const navItems = [
  { href: '/', key: 'nav.dashboard' },
  { href: '/signals', key: 'nav.signals' },
  { href: '/news', key: 'nav.news' },
  { href: '/journal', key: 'nav.journal' },
  { href: '/settings', key: 'nav.settings' },
]

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const locale: Locale = (settings?.language as Locale) ?? 'th'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
          🥇 {t('app.name', locale)}
        </Link>
        <nav className="flex flex-1 items-center space-x-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 ${
                pathname === item.href ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              {t(item.key, locale)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'dark' ? '🌙' : '☀️'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newLang: Locale = locale === 'th' ? 'en' : 'th'
              updateSettings({ language: newLang })
            }}
          >
            {locale === 'th' ? 'EN' : 'TH'}
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Create use-settings hook**

Write to `hooks/use-settings.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'

type Settings = {
  llmProvider: string
  llmApiKey: string
  marketDataProvider: string
  marketDataApiKey: string
  language: string
  theme: string
  cronEnabled: boolean
  cronInterval: number
  minConfidence: number
}

const defaultSettings: Settings = {
  llmProvider: 'openrouter',
  llmApiKey: '',
  marketDataProvider: 'twelvedata',
  marketDataApiKey: '',
  language: 'th',
  theme: 'dark',
  cronEnabled: false,
  cronInterval: 15,
  minConfidence: 75,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data ?? defaultSettings))
      .catch(() => setSettings(defaultSettings))
      .finally(() => setLoading(false))
  }, [])

  const updateSettings = async (partial: Partial<Settings>) => {
    const merged = { ...settings, ...partial } as Settings
    setSettings(merged)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    })
  }

  return { settings, loading, updateSettings }
}
```

- [ ] **Step 5: Update globals.css**

Write to `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 47 95% 50%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 47 95% 50%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 47 95% 50%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 47 95% 50%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 6: Update root layout**

Write to `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Alpha Gold Signals',
  description: 'AI-powered XAUUSD trading signals platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Header />
          <main className="container py-6">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: layout + theme + i18n setup"
```

---

### Task 3: Settings API + Page

**Files:**
- Create: `app/api/settings/route.ts`
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Write Settings API routes**

Write to `app/api/settings/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  let settings = await prisma.settings.findUnique({ where: { id: 'default' } })
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 'default' },
    })
  }
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: body,
    create: { id: 'default', ...body },
  })
  return NextResponse.json(settings)
}
```

- [ ] **Step 2: Write Settings page**

Write to `app/settings/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { t, type Locale } from '@/lib/i18n'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings)
  }, [])

  const save = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    toast({ title: 'Saved', description: 'Settings updated successfully' })
  }

  if (!settings) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('settings.api_keys', settings.language as Locale)}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.llm', settings.language as Locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select
              value={settings.llmProvider}
              onValueChange={(v) => setSettings({ ...settings, llmProvider: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={settings.llmApiKey}
              onChange={(e) => setSettings({ ...settings, llmApiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.market', settings.language as Locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select
              value={settings.marketDataProvider}
              onValueChange={(v) => setSettings({ ...settings, marketDataProvider: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twelvedata">Twelve Data</SelectItem>
                <SelectItem value="alphavantage">Alpha Vantage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={settings.marketDataApiKey}
              onChange={(e) => setSettings({ ...settings, marketDataApiKey: e.target.value })}
              placeholder="api key..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language', settings.language as Locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('settings.language', settings.language as Locale)}</Label>
            <Select
              value={settings.language}
              onValueChange={(v) => setSettings({ ...settings, language: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="th">ไทย</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: settings API + page with API key management"
```

---

### Task 4: Chart Component (lightweight-charts)

**Files:**
- Create: `components/chart.tsx`
- Create: `hooks/use-gold-price.ts`
- Create: `app/api/prices/route.ts`

- [ ] **Step 1: Write gold price API**

Write to `app/api/prices/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
  if (!settings?.marketDataApiKey) {
    // Return mock data for demo
    const now = Date.now()
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      time: (now - (100 - i) * 900000) / 1000,
      open: 2650 + Math.random() * 10,
      high: 2655 + Math.random() * 10,
      low: 2645 + Math.random() * 10,
      close: 2650 + Math.random() * 10,
    }))
    return NextResponse.json(mockData)
  }

  const provider = settings.marketDataProvider
  const apiKey = settings.marketDataApiKey
  let url = ''

  if (provider === 'twelvedata') {
    url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=15min&outputsize=100&apikey=${apiKey}`
  } else {
    url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=15min&outputsize=100&apikey=${apiKey}`
  }

  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Write use-gold-price hook**

Write to `hooks/use-gold-price.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'

type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export function useGoldPrice() {
  const [data, setData] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices')
        const json = await res.json()
        if (Array.isArray(json)) {
          setData(json)
        }
      } catch (e) {
        setError('Failed to load price data')
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 900000) // every 15 min
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error }
}
```

- [ ] **Step 3: Write Chart component**

Write to `components/chart.tsx`:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import { useGoldPrice } from '@/hooks/use-gold-price'
import { Card } from '@/components/ui/card'

export function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const { data, loading } = useGoldPrice()

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#888',
      },
      grid: {
        vertLines: { color: '#1a1a2e' },
        horzLines: { color: '#1a1a2e' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeries.setData(data)

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data])

  return (
    <Card className="p-4">
      <div ref={chartContainerRef} className="w-full" />
      {loading && <div className="text-center text-muted-foreground py-4">Loading chart...</div>}
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: chart component with lightweight-charts"
```

---

### Task 5: Manual Signal Generation API + UI

**Files:**
- Create: `app/api/signals/route.ts`
- Create: `app/api/analyze/route.ts`
- Create: `components/signal-generator.tsx`
- Create: `components/signal-card.tsx`

- [ ] **Step 1: Write Signals API**

Write to `app/api/signals/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const signals = await prisma.signal.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(signals)
}

export async function POST(request: Request) {
  const body = await request.json()
  const signal = await prisma.signal.create({
    data: {
      type: body.type,
      timeframe: body.timeframe,
      entry: body.entry,
      takeProfit: body.takeProfit,
      stopLoss: body.stopLoss,
      confidence: body.confidence,
      confluence: body.confluence ?? 0,
      reasoning: body.reasoning,
      analysis: JSON.stringify(body.analysis ?? {}),
    },
  })
  return NextResponse.json(signal)
}
```

- [ ] **Step 2: Write Analyze API (manual trigger)**

Write to `app/api/analyze/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
  if (!settings?.llmApiKey) {
    // No API key set - return mock signal
    const mockSignal = {
      type: Math.random() > 0.5 ? 'BUY' : 'SELL',
      timeframe: 'H1',
      entry: 2650 + Math.random() * 20,
      takeProfit: 2680 + Math.random() * 20,
      stopLoss: 2635 + Math.random() * 10,
      confidence: Math.floor(60 + Math.random() * 35),
      reasoning: 'Mock signal - configure LLM API key for real analysis',
      analysis: {},
    }

    const signal = await prisma.signal.create({ data: mockSignal })
    return NextResponse.json(signal)
  }

  // TODO: Phase 3 - Real LLM analysis
  return NextResponse.json({ error: 'LLM integration pending' }, { status: 501 })
}
```

- [ ] **Step 3: Write SignalCard component**

Write to `components/signal-card.tsx`:

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t, type Locale } from '@/lib/i18n'

type Signal = {
  id: string
  type: string
  timeframe: string
  entry: number
  takeProfit: number
  stopLoss: number
  confidence: number
  reasoning: string
  status: string
  createdAt: string
}

const typeColors: Record<string, string> = {
  BUY: 'bg-green-500',
  SELL: 'bg-red-500',
  NEUTRAL: 'bg-yellow-500',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-blue-500',
  HIT_TP: 'bg-green-500',
  HIT_SL: 'bg-red-500',
  EXPIRED: 'bg-gray-500',
}

export function SignalCard({ signal, locale }: { signal: Signal; locale: Locale }) {
  const tpPips = ((signal.takeProfit - signal.entry) * 100).toFixed(1)
  const slPips = ((signal.entry - signal.stopLoss) * 100).toFixed(1)

  return (
    <Card className="border-l-4" style={{ borderLeftColor: signal.type === 'BUY' ? '#22c55e' : '#ef4444' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={typeColors[signal.type]}>
              {t(`signal.${signal.type.toLowerCase()}`, locale)}
            </Badge>
            <Badge variant="outline">{signal.timeframe}</Badge>
            <Badge className={statusColors[signal.status]}>
              {t(`signal.${signal.status.toLowerCase()}`, locale)}
            </Badge>
          </div>
          <span className="text-sm font-bold">
            {signal.confidence}% confidence
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm mb-2">
          <div>
            <span className="text-muted-foreground">Entry: </span>
            <span className="font-mono">${signal.entry.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">TP: </span>
            <span className="font-mono text-green-500">
              ${signal.takeProfit.toFixed(2)} (+{tpPips}p)
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">SL: </span>
            <span className="font-mono text-red-500">
              ${signal.stopLoss.toFixed(2)} (-{slPips}p)
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{signal.reasoning}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(signal.createdAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Write SignalGenerator component**

Write to `components/signal-generator.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { t, type Locale } from '@/lib/i18n'

export function SignalGenerator({ locale, onSignal }: { locale: Locale; onSignal: () => void }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', { method: 'POST' })
      const data = await res.json()
      if (data.id) {
        toast({ title: 'Signal generated!', description: `${data.type} ${data.timeframe} @ $${data.entry.toFixed(2)}` })
        onSignal()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate signal', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('signal.generate', locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={generate} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Analyzing...' : t('signal.generate', locale)}
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: signal API + manual generate + signal card UI"
```

---

### Task 6: Dashboard Page

**Files:**
- Create: `app/page.tsx`
- Create: `app/layout.tsx` (update for language context)

- [ ] **Step 1: Write Dashboard page**

Write to `app/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Chart } from '@/components/chart'
import { SignalGenerator } from '@/components/signal-generator'
import { SignalCard } from '@/components/signal-card'
import { useSettings } from '@/hooks/use-settings'
import { type Locale } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { settings } = useSettings()
  const [signals, setSignals] = useState<any[]>([])
  const locale: Locale = (settings?.language as Locale) ?? 'th'

  const loadSignals = async () => {
    const res = await fetch('/api/signals?limit=5')
    const data = await res.json()
    setSignals(data)
  }

  useEffect(() => { loadSignals() }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🥇 Alpha Gold Signals</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Chart />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Latest Signals</h2>
            {signals.length === 0 ? (
              <p className="text-muted-foreground">No signals yet. Click "Analyze" to generate one.</p>
            ) : (
              signals.map((s) => <SignalCard key={s.id} signal={s} locale={locale} />)
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SignalGenerator locale={locale} onSignal={loadSignals} />
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Signals</span>
                  <span className="font-bold">{signals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-bold">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Pair</span>
                  <span className="font-bold">XAU/USD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: dashboard page with chart + signal gen + latest signals"
```

---

### Task 7: Signals List Page

**Files:**
- Create: `app/signals/page.tsx`

- [ ] **Step 1: Write Signals list page**

Write to `app/signals/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { SignalCard } from '@/components/signal-card'
import { useSettings } from '@/hooks/use-settings'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Locale } from '@/lib/i18n'

export default function SignalsPage() {
  const { settings } = useSettings()
  const [signals, setSignals] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const locale: Locale = (settings?.language as Locale) ?? 'th'

  useEffect(() => {
    fetch('/api/signals?limit=100').then(r => r.json()).then(setSignals)
  }, [])

  const filtered = filter === 'all' ? signals : signals.filter(s => s.type === filter.toUpperCase())

  const winRate = signals.length > 0
    ? ((signals.filter(s => s.status === 'HIT_TP').length / signals.filter(s => s.status !== 'PENDING').length) * 100).toFixed(1)
    : '--'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Signal History</h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{signals.length}</div>
          <div className="text-sm text-muted-foreground">Total Signals</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{winRate}%</div>
          <div className="text-sm text-muted-foreground">Win Rate</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">XAU/USD</div>
          <div className="text-sm text-muted-foreground">Pair</div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((s) => <SignalCard key={s.id} signal={s} locale={locale} />)}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No signals found</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: signals list page with filtering"
```

---

### Task 8: News/Calendar + Journal placeholder pages

**Files:**
- Create: `app/news/page.tsx`
- Create: `app/journal/page.tsx`

- [ ] **Step 1: Write News page**

Write to `app/news/page.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettings } from '@/hooks/use-settings'
import { type Locale } from '@/lib/i18n'

export default function NewsPage() {
  const { settings } = useSettings()
  const locale: Locale = (settings?.language as Locale) ?? 'th'

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">News & Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Economic Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Coming in Phase 4 - Economic Calendar with event notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Write Journal page**

Write to `app/journal/page.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettings } from '@/hooks/use-settings'
import { type Locale } from '@/lib/i18n'

export default function JournalPage() {
  const { settings } = useSettings()
  const locale: Locale = (settings?.language as Locale) ?? 'th'

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trading Journal</h1>
      <Card>
        <CardHeader>
          <CardTitle>My Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Coming in Phase 4 - Track and analyze your trades.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: placeholder pages for news + journal"
```
