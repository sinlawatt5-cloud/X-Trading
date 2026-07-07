import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMarketNews } from '@/lib/market-news';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    const news = await getMarketNews({
      marketDataProvider: settings?.marketDataProvider ?? 'twelvedata',
      marketDataApiKey: settings?.marketDataApiKey ?? null,
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Failed to fetch market news:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch market news' },
      { status: 500 }
    );
  }
}
