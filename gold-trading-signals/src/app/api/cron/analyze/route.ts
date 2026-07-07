import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runGoldAnalysis } from '@/lib/gold-analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings?.cronEnabled) {
      return NextResponse.json({ error: 'Cron disabled' }, { status: 400 });
    }

    if (!settings?.llmApiKey) {
      return NextResponse.json({ error: 'LLM API key missing' }, { status: 400 });
    }

    const result = await runGoldAnalysis({
      llmProvider: settings.llmProvider,
      llmApiKey: settings.llmApiKey,
      llmModel: settings.llmModel ?? null,
      marketDataProvider: settings.marketDataProvider,
      marketDataApiKey: settings.marketDataApiKey ?? null,
    });

    return NextResponse.json({
      success: true,
      signalId: result.signal.id,
      signalType: result.signal.type,
      confidence: result.signal.confidence,
      source: result.source,
      duration: result.duration,
      pricesCount: result.pricesCount,
    });
  } catch (error) {
    console.error('Cron analyze failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run cron analysis' },
      { status: 500 }
    );
  }
}
