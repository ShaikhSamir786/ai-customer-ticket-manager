import axios from 'axios';
import { LLMProvider, LLMResponse } from './types';
import config from '../config';

export class OllamaProvider implements LLMProvider {
  name = 'ollama';

  async analyze(prompt: string, options?: Record<string, any>): Promise<LLMResponse> {
    const model = options?.model || 'llama3';
    const response = await axios.post(`${config.llm.ollamaEndpoint}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: { temperature: options?.temperature ?? 0.3 },
    });

    return {
      content: response.data.response,
      model: response.data.model,
      usage: {
        promptTokens: response.data.prompt_eval_count || 0,
        completionTokens: response.data.eval_count || 0,
        totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
      },
    };
  }
}
