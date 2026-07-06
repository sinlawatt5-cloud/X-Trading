import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default' },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        llmProvider: body.llmProvider,
        llmApiKey: body.llmApiKey,
        marketDataProvider: body.marketDataProvider,
        marketDataApiKey: body.marketDataApiKey,
        language: body.language,
        theme: body.theme,
        cronEnabled: body.cronEnabled,
        cronInterval: body.cronInterval,
        minConfidence: body.minConfidence,
      },
      create: {
        id: 'default',
        llmProvider: body.llmProvider || 'anthropic',
        llmApiKey: body.llmApiKey,
        marketDataProvider: body.marketDataProvider || 'twelvedata',
        marketDataApiKey: body.marketDataApiKey,
        language: body.language || 'en',
        theme: body.theme || 'light',
        cronEnabled: body.cronEnabled || false,
        cronInterval: body.cronInterval || 15,
        minConfidence: body.minConfidence || 70,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}