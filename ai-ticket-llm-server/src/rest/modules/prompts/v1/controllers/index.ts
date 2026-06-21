import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@ai-ticket/shared-lib';
import { getPrompts, createPrompt } from '../services';

export const getPromptsController = catchAsync(async (_req: Request, res: Response) => {
  (res as any).json(await getPrompts());
});

export const createPromptController = catchAsync(async (req: Request, res: Response) => {
  (res as any).status(201).json(await createPrompt((req as any).body));
});

