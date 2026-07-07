import { getDefaultModelForProvider } from '@/lib/llm-providers';

type LlmTestInput = {
  llmProvider: string;
  llmApiKey: string | null;
  llmModel?: string | null;
};

type MarketTestInput = {
  marketDataProvider: string;
  marketDataApiKey: string | null;
};

type RemoteModel = {
  id: string;
  label: string;
};

function sortModels(models: RemoteModel[]) {
  return [...models].sort((left, right) => left.label.localeCompare(right.label));
}

function filterOpenAiLikeModels(models: string[]) {
  return sortModels(
    models
      .filter((id) => {
        const lower = id.toLowerCase();
        return ![
          'embedding',
          'moderation',
          'whisper',
          'tts',
          'transcribe',
          'omni-moderation',
          'image',
          'audio',
          'search',
          'realtime',
        ].some((blocked) => lower.includes(blocked));
      })
      .map((id) => ({
        id,
        label: id,
      }))
  );
}

export async function fetchLlmModels(input: LlmTestInput): Promise<RemoteModel[]> {
  const apiKey = input.llmApiKey?.trim();
  if (!apiKey) {
    throw new Error('Missing LLM API key');
  }

  if (input.llmProvider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic models failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id?: string; display_name?: string }>;
    };

    return sortModels(
      (data.data ?? [])
        .filter((model) => typeof model.id === 'string' && model.id)
        .map((model) => ({
          id: model.id as string,
          label: model.display_name || (model.id as string),
        }))
    );
  }

  if (input.llmProvider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI models failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };

    return filterOpenAiLikeModels((data.data ?? []).map((model) => model.id || '').filter(Boolean));
  }

  if (input.llmProvider === 'openrouter') {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter models failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id?: string; name?: string }>;
    };

    return sortModels(
      (data.data ?? [])
        .filter((model) => typeof model.id === 'string' && model.id)
        .map((model) => ({
          id: model.id as string,
          label: model.name || (model.id as string),
        }))
    );
  }

  if (input.llmProvider === 'deepseek') {
    const response = await fetch('https://api.deepseek.com/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DeepSeek models failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id?: string; owned_by?: string }>;
    };

    return sortModels(
      (data.data ?? [])
        .filter((model) => typeof model.id === 'string' && model.id)
        .map((model) => ({
          id: model.id as string,
          label: model.id as string,
        }))
    );
  }

  throw new Error(`Unsupported LLM provider: ${input.llmProvider}`);
}

export async function testLlmProviderConnection(input: LlmTestInput) {
  const apiKey = input.llmApiKey?.trim();
  if (!apiKey) {
    throw new Error('Missing LLM API key');
  }

  const provider = input.llmProvider;
  const models = await fetchLlmModels(input);
  const preferredModel = input.llmModel?.trim();
  const model =
    (preferredModel && models.find((item) => item.id === preferredModel)?.id) ||
    models[0]?.id ||
    getDefaultModelForProvider(provider);

  if (!model) {
    throw new Error('No model available for this provider');
  }
  const startTime = Date.now();

  if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-haiku-20241022',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic test failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    return {
      provider,
      model,
      models,
      latencyMs: Date.now() - startTime,
      preview: data.content?.[0]?.text?.trim() || 'OK',
    };
  }

  const configs: Record<
    string,
    {
      url: string;
      model: string;
      headers: Record<string, string>;
    }
  > = {
    openai: {
      url: 'https://api.openai.com/v1/chat/completions',
      model: model || 'gpt-4o-mini',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: model || 'google/gemini-2.0-flash-001',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
    deepseek: {
      url: 'https://api.deepseek.com/chat/completions',
      model: model || 'deepseek-v4-flash',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
  };

  const config = configs[provider];
  if (!config) {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: 'Reply with OK only.' }],
      max_tokens: 20,
      ...(provider === 'deepseek'
        ? {
            thinking: { type: 'disabled' },
          }
        : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${provider} test failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

    return {
      provider,
      model: config.model,
      models,
      latencyMs: Date.now() - startTime,
      preview: data.choices?.[0]?.message?.content?.trim() || 'OK',
    };
}

export async function testMarketProviderConnection(input: MarketTestInput) {
  const apiKey = input.marketDataApiKey?.trim();
  if (!apiKey) {
    throw new Error('Missing market data API key');
  }

  const provider = input.marketDataProvider;
  const startTime = Date.now();

  if (provider === 'twelvedata') {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${apiKey}`,
      {
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Twelve Data test failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { price?: string; status?: string; message?: string };
    if (!data.price) {
      throw new Error(data.message || 'Twelve Data returned no price');
    }

    return {
      provider,
      latencyMs: Date.now() - startTime,
      symbol: 'XAU/USD',
      price: Number(data.price),
    };
  }

  if (provider === 'alphavantage') {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${apiKey}`,
      {
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Alpha Vantage test failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      'Realtime Currency Exchange Rate'?: {
        '5. Exchange Rate'?: string;
      };
      Note?: string;
      Information?: string;
      ErrorMessage?: string;
    };

    const price = data['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
    if (!price) {
      throw new Error(data.Note || data.Information || data.ErrorMessage || 'Alpha Vantage returned no price');
    }

    return {
      provider,
      latencyMs: Date.now() - startTime,
      symbol: 'XAU/USD',
      price: Number(price),
    };
  }

  throw new Error(`Unsupported market provider: ${provider}`);
}
