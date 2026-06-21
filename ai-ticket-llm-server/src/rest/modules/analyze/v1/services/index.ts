import { z } from 'zod';
import { LLMRouter } from '../../../../../providers/router';
import { ValidationError } from '@ai-ticket/shared-lib';
import type { ProviderType } from '../../../../../providers/types';

const analyzeRequestSchema = z.object({
  prompt: z.string().min(1).max(32000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32000).optional(),
  jsonMode: z.boolean().optional(),
});

const router = new LLMRouter();

export async function analyze(data: unknown) {
  const parsed = analyzeRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid request: ${parsed.error.message}`);
  }

  return router.analyze(parsed.data.prompt, {
    model: parsed.data.model,
    temperature: parsed.data.temperature,
    maxTokens: parsed.data.maxTokens,
    jsonMode: parsed.data.jsonMode,
  });
}

export async function analyzeWithProvider(provider: ProviderType, data: unknown) {
  const parsed = analyzeRequestSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(`Invalid request: ${parsed.error.message}`);
  }

  if (!router.getAvailableProviders().includes(provider)) {
    throw new ValidationError(`Provider ${provider} not available. Available: ${router.getAvailableProviders().join(', ')}`);
  }

  return router.analyze(parsed.data.prompt, {
    model: parsed.data.model,
    temperature: parsed.data.temperature,
    maxTokens: parsed.data.maxTokens,
    jsonMode: parsed.data.jsonMode,
    preferredProvider: provider,
  });
}

