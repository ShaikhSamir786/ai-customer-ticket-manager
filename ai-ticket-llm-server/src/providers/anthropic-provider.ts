import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMResponse } from './types';
import config from '../config';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.llm.anthropicApiKey });
  }

  async analyze(prompt: string, options?: Record<string, any>): Promise<LLMResponse> {
    const model = options?.model || 'claude-3-opus-20240229';
    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content.map(b => 'text' in b ? b.text : '').join('');

    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    };
  }
}
