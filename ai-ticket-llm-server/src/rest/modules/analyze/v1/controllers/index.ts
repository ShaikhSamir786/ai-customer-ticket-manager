import { Request, Response } from 'express';
import { catchAsync } from '@ai-ticket/shared-lib';
import { isProviderType } from '../../../../../providers/types';
import { analyze, analyzeWithProvider } from '../services';

export const analyzeController = catchAsync(async (req: Request, res: Response) => {
  (res as any).json(await analyze((req as any).body));
});

export const analyzeWithProviderController = catchAsync(async (req: Request, res: Response) => {
  const provider = (req as any).params.provider as string;
  if (!isProviderType(provider)) {
    (res as any).status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid provider: ${provider}. Valid providers: openai, anthropic, ollama`,
      },
    });
    return;
  }
  (res as any).json(await analyzeWithProvider(provider, (req as any).body));
});

