import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d',
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.chart?.result?.[0]?.meta) {
        return NextResponse.json({ status: 'online' });
      }
    }
    
    return NextResponse.json({ status: 'offline' });
  } catch (error) {
    return NextResponse.json({ status: 'offline' });
  }
}
