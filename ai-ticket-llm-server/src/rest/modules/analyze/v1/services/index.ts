import { LLMRouter } from '../../../../../providers/router';
import { ValidationError } from '@ai-ticket/shared-lib';
import type { ProviderType } from '../../../../../providers/types';

const router = new LLMRouter();

export async function analyze(data: { prompt: string; model?: string; temperature?: number; maxTokens?: number; jsonMode?: boolean }) {
  if (!data.prompt) throw new ValidationError('prompt is required');

  return router.analyze(data.prompt, {
    model: data.model,
    temperature: data.temperature,
    maxTokens: data.maxTokens,
    jsonMode: data.jsonMode,
  });
}

export async function analyzeWithProvider(provider: ProviderType, data: { prompt: string; model?: string; temperature?: number; maxTokens?: number; jsonMode?: boolean }) {
  if (!data.prompt) throw new ValidationError('prompt is required');
  if (!router.getAvailableProviders().includes(provider)) {
    throw new ValidationError(`Provider ${provider} not available. Available: ${router.getAvailableProviders().join(', ')}`);
  }

  return router.analyze(data.prompt, {
    model: data.model,
    temperature: data.temperature,
    maxTokens: data.maxTokens,
    jsonMode: data.jsonMode,
    preferredProvider: provider,
  });
}

