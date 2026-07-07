import { NextResponse } from 'next/server';
import { testLlmProviderConnection, testMarketProviderConnection } from '@/lib/provider-tests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = typeof body.kind === 'string' ? body.kind : '';

    if (kind === 'llm') {
      const result = await testLlmProviderConnection({
        llmProvider: typeof body.llmProvider === 'string' ? body.llmProvider : '',
        llmApiKey: typeof body.llmApiKey === 'string' ? body.llmApiKey : null,
        llmModel: typeof body.llmModel === 'string' ? body.llmModel : null,
      });

      return NextResponse.json({
        ok: true,
        ...result,
      });
    }

    if (kind === 'market') {
      const result = await testMarketProviderConnection({
        marketDataProvider: typeof body.marketDataProvider === 'string' ? body.marketDataProvider : '',
        marketDataApiKey: typeof body.marketDataApiKey === 'string' ? body.marketDataApiKey : null,
      });

      return NextResponse.json({
        ok: true,
        ...result,
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Unsupported test kind' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Provider test failed',
      },
      { status: 400 }
    );
  }
}
