export type SupportedLlmProvider = 'anthropic' | 'openai' | 'openrouter' | 'deepseek';

export type LlmModelOption = {
  value: string;
  label: string;
};

export const LLM_MODEL_OPTIONS: Record<SupportedLlmProvider, LlmModelOption[]> = {
  anthropic: [
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
  openrouter: [
    { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  ],
  deepseek: [
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat (legacy alias)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (legacy alias)' },
  ],
};

export function isSupportedLlmProvider(provider: string): provider is SupportedLlmProvider {
  return provider in LLM_MODEL_OPTIONS;
}

export function getDefaultModelForProvider(provider: string) {
  if (!isSupportedLlmProvider(provider)) {
    return null;
  }

  return LLM_MODEL_OPTIONS[provider][0]?.value ?? null;
}

export function getModelsForProvider(provider: string) {
  if (!isSupportedLlmProvider(provider)) {
    return [];
  }

  return LLM_MODEL_OPTIONS[provider];
}
