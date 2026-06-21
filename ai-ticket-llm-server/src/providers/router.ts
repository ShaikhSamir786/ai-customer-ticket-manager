import { LLMProvider, ProviderType, PROVIDER_TYPES, isProviderType } from './types';
import type { ProviderError, LLMOptions } from './types';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { OllamaProvider } from './ollama-provider';
import { logger } from '../logger';

export class LLMRouter {
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private fallbackOrder: ProviderType[] = ['openai', 'anthropic', 'ollama'];

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider());
    }
    this.providers.set('ollama', new OllamaProvider());

    const envOrder = process.env.LLM_PROVIDER_ORDER;
    if (envOrder) {
      const parsed = envOrder.split(',')
        .map(s => s.trim())
        .filter((s): s is ProviderType => isProviderType(s));
      if (parsed.length > 0) {
        this.fallbackOrder = parsed;
      }
    }
  }

  async analyze(
    prompt: string,
    options?: LLMOptions & { preferredProvider?: ProviderType }
  ) {
    const order = options?.preferredProvider
      ? [options.preferredProvider, ...this.fallbackOrder.filter(p => p !== options.preferredProvider)]
      : this.fallbackOrder;

    const providerErrors: ProviderError[] = [];

    for (const providerType of order) {
      const provider = this.providers.get(providerType);
      if (!provider) {
        providerErrors.push({ provider: providerType, error: 'Not configured (no API key)' });
        continue;
      }

      try {
        const result = await provider.analyze(prompt, options);
        logger.info('LLM analysis successful', { provider: provider.name, model: result.model, totalTokens: result.usage.totalTokens });
        return { ...result, provider: provider.name };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(`LLM provider ${providerType} failed`, { error: message });
        providerErrors.push({ provider: providerType, error: message });
      }
    }

    const errorDetail = providerErrors.map(e => `${e.provider}: ${e.error}`).join('; ');
    throw new Error(`All LLM providers failed — ${errorDetail}`);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
