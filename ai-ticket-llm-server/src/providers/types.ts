export interface LLMProvider {
  name: string;
  analyze(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export const PROVIDER_TYPES = ['openai', 'anthropic', 'ollama'] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

export function isProviderType(val: string): val is ProviderType {
  return (PROVIDER_TYPES as readonly string[]).includes(val);
}

export interface ProviderError {
  provider: string;
  error: string;
}
