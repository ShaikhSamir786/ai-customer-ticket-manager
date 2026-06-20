import { LLMProvider, ProviderType } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { OllamaProvider } from './ollama-provider';
import { logger } from '../logger';

export class LLMRouter {
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private fallbackOrder: ProviderType[];

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider());
    }
    this.providers.set('ollama', new OllamaProvider());

    this.fallbackOrder = ['openai', 'anthropic', 'ollama'];
  }

  async analyze(
    prompt: string,
    options?: { model?: string; temperature?: number; maxTokens?: number; jsonMode?: boolean; preferredProvider?: ProviderType }
  ): Promise<{ content: string; model: string; provider: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    const order = options?.preferredProvider
      ? [options.preferredProvider, ...this.fallbackOrder.filter(p => p !== options.preferredProvider)]
      : this.fallbackOrder;

    for (const providerType of order) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      try {
        const result = await provider.analyze(prompt, options);
        logger.info('LLM analysis successful', { provider: provider.name, model: result.model, totalTokens: result.usage.totalTokens });
        return { ...result, provider: provider.name };
      } catch (err: any) {
        logger.warn(`LLM provider ${providerType} failed`, { error: err.message });
      }
    }

    throw new Error('All LLM providers failed');
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
