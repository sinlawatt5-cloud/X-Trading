import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Total counts by type
    const [totalSignals, buyCount, sellCount, neutralCount, activeCount] = await Promise.all([
      prisma.signal.count(),
      prisma.signal.count({ where: { type: 'BUY' } }),
      prisma.signal.count({ where: { type: 'SELL' } }),
      prisma.signal.count({ where: { type: 'NEUTRAL' } }),
      prisma.signal.count({ where: { status: 'ACTIVE' } }),
    ])

    // Average confidence
    const aggResult = await prisma.signal.aggregate({
      _avg: { confidence: true },
    })
    const avgConfidence = Math.round((aggResult._avg.confidence ?? 0) * 10) / 10

    // Signals per day — last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentSignals = await prisma.signal.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Build signalsByDay map for last 7 days
    const signalsByDay: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10) // YYYY-MM-DD
      const count = recentSignals.filter((s) => {
        return s.createdAt.toISOString().slice(0, 10) === dateStr
      }).length
      signalsByDay.push({ date: dateStr, count })
    }

    // Confidence distribution
    const allConfidences = await prisma.signal.findMany({
      select: { confidence: true },
    })

    const confidenceDistribution = [
      { range: '0-50', label: 'Low', count: 0 },
      { range: '50-70', label: 'Medium', count: 0 },
      { range: '70-85', label: 'High', count: 0 },
      { range: '85-100', label: 'Very High', count: 0 },
    ]

    for (const { confidence } of allConfidences) {
      if (confidence < 50) confidenceDistribution[0].count++
      else if (confidence < 70) confidenceDistribution[1].count++
      else if (confidence < 85) confidenceDistribution[2].count++
      else confidenceDistribution[3].count++
    }

    return NextResponse.json({
      totalSignals,
      buyCount,
      sellCount,
      neutralCount,
      avgConfidence,
      activeCount,
      signalsByDay,
      confidenceDistribution,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
