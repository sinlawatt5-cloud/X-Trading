import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    const signals = await prisma.signal.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { journalEntry: true },
    })

    return NextResponse.json(signals)
  } catch (error) {
    console.error('Failed to fetch signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const signal = await prisma.signal.create({
      data: {
        type: body.type,
        timeframe: body.timeframe,
        entry: body.entry,
        takeProfit: body.takeProfit,
        stopLoss: body.stopLoss,
        confidence: body.confidence,
        confluence: JSON.stringify(body.confluence || []),
        reasoning: body.reasoning,
        analysis: JSON.stringify(body.analysis || {}),
        status: body.status || 'ACTIVE',
      },
    })

    return NextResponse.json(signal, { status: 201 })
  } catch (error) {
    console.error('Failed to create signal:', error)
    return NextResponse.json(
      { error: 'Failed to create signal' },
      { status: 500 }
    )
  }
}