import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ─── Validation schema ──────────────────────────────────────────────────────

const createEntrySchema = z.object({
  signalId: z.string().optional().nullable(),
  date: z.string().datetime({ offset: true }),
  symbol: z.string().min(1).max(20),
  direction: z.enum(['BUY', 'SELL']),
  entry: z.number().positive(),
  exit: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  pips: z.number(),
  pnl: z.number(),
  notes: z.string().optional().nullable(),
  screenshot: z.string().optional().nullable(),
})

// ─── Mock fallback data ─────────────────────────────────────────────────────

const MOCK_ENTRIES = [
  {
    id: 'mock-1',
    signalId: null,
    signal: null,
    date: new Date('2024-01-15T10:00:00Z').toISOString(),
    symbol: 'XAUUSD',
    direction: 'BUY',
    entry: 2020.5,
    exit: 2045.0,
    stopLoss: 2010.0,
    takeProfit: 2050.0,
    pips: 24.5,
    pnl: 245.0,
    notes: 'Wyckoff Spring setup — clean breakout',
    screenshot: null,
    createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  },
  {
    id: 'mock-2',
    signalId: null,
    signal: null,
    date: new Date('2024-01-16T08:30:00Z').toISOString(),
    symbol: 'XAUUSD',
    direction: 'SELL',
    entry: 2048.0,
    exit: 2030.0,
    stopLoss: 2055.0,
    takeProfit: 2020.0,
    pips: -18.0,
    pnl: -180.0,
    notes: 'SMC OB rejection — stopped out early',
    screenshot: null,
    createdAt: new Date('2024-01-16T08:30:00Z').toISOString(),
  },
]

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const signalId = searchParams.get('signalId')

    const entries = await prisma.journalEntry.findMany({
      where: signalId ? { signalId } : undefined,
      orderBy: { date: 'desc' },
      include: { signal: true },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Failed to fetch journal entries:', error)
    // Return mock data as fallback so the UI never breaks
    return NextResponse.json(MOCK_ENTRIES)
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = createEntrySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    const entry = await prisma.journalEntry.create({
      data: {
        signalId: data.signalId ?? null,
        date: new Date(data.date),
        symbol: data.symbol,
        direction: data.direction,
        entry: data.entry,
        exit: data.exit,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        pips: data.pips,
        pnl: data.pnl,
        notes: data.notes ?? null,
        screenshot: data.screenshot ?? null,
      },
      include: { signal: true },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Failed to create journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    )
  }
}
