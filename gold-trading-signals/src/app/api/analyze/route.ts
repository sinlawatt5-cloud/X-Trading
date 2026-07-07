import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runGoldAnalysis } from '@/lib/gold-analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    const result = await runGoldAnalysis({
      llmProvider: settings?.llmProvider ?? 'anthropic',
      llmApiKey: settings?.llmApiKey ?? null,
      llmModel: settings?.llmModel ?? null,
      marketDataProvider: settings?.marketDataProvider ?? 'twelvedata',
      marketDataApiKey: settings?.marketDataApiKey ?? null,
    });

    return NextResponse.json(result.signal, { status: 201 });
  } catch (error) {
    console.error('Failed to generate signal:', error);
    return NextResponse.json(
      { error: 'Failed to generate signal' },
      { status: 500 }
    );
  }
}
