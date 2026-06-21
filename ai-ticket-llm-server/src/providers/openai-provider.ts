import OpenAI from 'openai';
import { LLMProvider, LLMResponse } from './types';
import type { LLMOptions } from './types';
import config from '../config';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.openaiApiKey,
      timeout: 30000,
      maxRetries: 2,
    });
  }

  async analyze(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || config.llm.defaultModel;
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2000,
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('OpenAI returned empty response');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }
}
