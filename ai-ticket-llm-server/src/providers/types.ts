export interface LLMProvider {
  name: string;
  analyze(prompt: string, options?: Record<string, any>): Promise<LLMResponse>;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export type ProviderType = 'openai' | 'anthropic' | 'ollama';
