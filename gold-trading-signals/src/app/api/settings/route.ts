import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SETTINGS = {
  llmProvider: 'anthropic',
  llmModel: null,
  marketDataProvider: 'twelvedata',
  language: 'th',
  theme: 'light',
  cronEnabled: false,
  cronInterval: 15,
  minConfidence: 70,
};

function coerceNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function coerceBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function normalizeSettings(body: Record<string, unknown>) {
  return {
    llmProvider: typeof body.llmProvider === 'string' && body.llmProvider ? body.llmProvider : DEFAULT_SETTINGS.llmProvider,
    llmApiKey:
      typeof body.llmApiKey === 'string'
        ? body.llmApiKey.trim() || null
        : body.llmApiKey === null
          ? null
          : undefined,
    llmModel:
      typeof body.llmModel === 'string'
        ? body.llmModel.trim() || null
        : body.llmModel === null
          ? null
          : undefined,
    marketDataProvider:
      typeof body.marketDataProvider === 'string' && body.marketDataProvider
        ? body.marketDataProvider
        : DEFAULT_SETTINGS.marketDataProvider,
    marketDataApiKey:
      typeof body.marketDataApiKey === 'string'
        ? body.marketDataApiKey.trim() || null
        : body.marketDataApiKey === null
          ? null
          : undefined,
    language: body.language === 'en' || body.language === 'th' ? body.language : DEFAULT_SETTINGS.language,
    theme: body.theme === 'light' || body.theme === 'dark' ? body.theme : DEFAULT_SETTINGS.theme,
    cronEnabled: coerceBoolean(body.cronEnabled, DEFAULT_SETTINGS.cronEnabled),
    cronInterval: coerceNumber(body.cronInterval, DEFAULT_SETTINGS.cronInterval),
    minConfidence: coerceNumber(body.minConfidence, DEFAULT_SETTINGS.minConfidence),
  };
}

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

async function updateSettings(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const update = normalizeSettings(body);

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update,
      create: {
        id: 'default',
        ...update,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return updateSettings(request);
}

export async function PATCH(request: Request) {
  return updateSettings(request);
}
