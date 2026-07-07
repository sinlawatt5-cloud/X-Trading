import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentIndicators } from '@/lib/gold-analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    const result = await getCurrentIndicators({
      llmProvider: settings?.llmProvider ?? 'anthropic',
      llmApiKey: settings?.llmApiKey ?? null,
      llmModel: settings?.llmModel ?? null,
      marketDataProvider: settings?.marketDataProvider ?? 'twelvedata',
      marketDataApiKey: settings?.marketDataApiKey ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch indicators:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch indicators' },
      { status: 500 }
    );
  }
}
