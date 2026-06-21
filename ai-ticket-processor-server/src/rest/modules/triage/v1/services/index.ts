import axios from 'axios';
import http from 'http';
import https from 'https';
import config from '../../../../../config';
import { logger } from '../../../../../logger';
import { ValidationError, ExternalServiceError } from '@ai-ticket/shared-lib';
import type { TicketData, ProcessTicketResponse } from '../../../../../types/dto';

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

const TRIAGE_PROMPT = `You are an expert AI customer support ticket triage assistant. Analyze the following ticket and return a JSON object with:
- category: one of ["billing", "technical", "account", "product", "legal", "other"]
- priority: one of ["low", "medium", "high", "critical"]
- sentiment: one of ["frustrated", "neutral", "satisfied", "angry", "confused"]
- assignedTeam: one of ["technical-support", "finance-support", "account-management", "product-support"]
- confidence: a number between 0 and 1
- needsHumanReview: boolean (true if confidence < 0.7 or contains legal/financial/security keywords)
- suggestedReply: a short, empathetic draft response
- churnRisk: a number between 0 and 1 indicating likelihood of customer churn

Ticket Subject: {{subject}}
Ticket Message: {{message}}
Customer Tier: {{customerTier}}
Source Channel: {{sourceChannel}}

Return ONLY valid JSON, no other text.`;

function sanitizePrompt(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/ignore all instructions/gi, '')
    .replace(/system prompt/gi, '')
    .trim();
}

function createAxiosInstance() {
  return axios.create({
    timeout: 25000,
    httpAgent,
    httpsAgent,
  });
}

export async function processTicket(ticketId: string): Promise<ProcessTicketResponse> {
  if (!ticketId) throw new ValidationError('ticketId is required');

  logger.info('Processing ticket', { ticketId });

  const api = createAxiosInstance();

  let ticket: TicketData;
  try {
    const res = await api.get(`${config.coreServerUrl}/v1/tickets/${ticketId}`);
    ticket = res.data as TicketData;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to fetch ticket from core server', { ticketId, error: message });
    throw new ExternalServiceError('core-server', `Failed to fetch ticket ${ticketId}`);
  }

  const sanitizedSubject = sanitizePrompt(ticket.subject || '');
  const sanitizedMessage = sanitizePrompt(ticket.message || '');

  const prompt = TRIAGE_PROMPT
    .replace('{{subject}}', sanitizedSubject)
    .replace('{{message}}', sanitizedMessage)
    .replace('{{customerTier}}', ticket.customerTier || 'standard')
    .replace('{{sourceChannel}}', ticket.sourceChannel || 'web');

  let llmResult: ReturnType<typeof applyRulesFallback>;
  try {
    const res = await api.post(`${config.llmServerUrl}/v1/analyze`, {
      prompt,
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 1000,
    });

    try {
      llmResult = JSON.parse(res.data.content);
    } catch {
      logger.warn('LLM returned non-JSON response, applying fallback', { ticketId });
      llmResult = applyRulesFallback(ticket);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('LLM analysis failed, applying rules-based fallback', { ticketId, error: message });
    llmResult = applyRulesFallback(ticket);
  }

  const triageResult: ProcessTicketResponse = {
    ticketId,
    category: llmResult.category || 'other',
    priority: llmResult.priority || 'medium',
    sentiment: llmResult.sentiment || 'neutral',
    assignedTeam: mapTeam(llmResult.assignedTeam || llmResult.category),
    confidence: llmResult.confidence ?? 0.5,
    needsHumanReview: llmResult.needsHumanReview ?? (llmResult.confidence < 0.7),
    suggestedReply: llmResult.suggestedReply || generateFallbackReply(ticket),
    modelUsed: 'gpt-4-turbo',
    churnRisk: llmResult.churnRisk ?? 0.3,
    timestamp: new Date().toISOString(),
  };

  try {
    await api.post(`${config.coreServerUrl}/v1/tickets/update-triage`, triageResult);
    logger.info('Triage result saved', { ticketId, confidence: triageResult.confidence });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to save triage result to core server', { ticketId, error: message });
    throw new ExternalServiceError('core-server', 'Failed to save triage result');
  }

  return triageResult;
}

export async function processBatch(ticketIds: string[]) {
  if (!ticketIds?.length) throw new ValidationError('ticketIds array is required');
  const results = await Promise.allSettled(ticketIds.map(id => processTicket(id)));

  const fulfilled: ProcessTicketResponse[] = [];
  const rejected: { ticketId: string; error: string }[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      fulfilled.push(result.value);
    } else {
      rejected.push({
        ticketId: ticketIds[index],
        error: result.reason?.message || String(result.reason),
      });
    }
  });

  return { processed: fulfilled, failed: rejected, total: ticketIds.length };
}

function mapTeam(categoryOrTeam: string): string {
  const teamMap: Record<string, string> = {
    billing: 'finance-support',
    technical: 'technical-support',
    account: 'account-management',
    product: 'product-support',
    legal: 'account-management',
    'finance-support': 'finance-support',
    'technical-support': 'technical-support',
    'account-management': 'account-management',
    'product-support': 'product-support',
  };
  return teamMap[categoryOrTeam?.toLowerCase()] || 'technical-support';
}

function applyRulesFallback(ticket: TicketData) {
  const msg = (ticket.message || '').toLowerCase();
  const subj = (ticket.subject || '').toLowerCase();
  const combined = `${subj} ${msg}`;

  let category = 'other';
  let priority = 'medium';
  let sentiment = 'neutral';

  if (/charg|pay|bill|refund|invoic|subscription|cancel|pric|cost|dollar|\$/.test(combined)) {
    category = 'billing';
  } else if (/error|bug|crash|fail|broken|500|404|timeout|api|login|password|access/.test(combined)) {
    category = 'technical';
  } else if (/account|profile|upgrade|downgrade|setting|preference/.test(combined)) {
    category = 'account';
  } else if (/featur|suggest|request|enhance|roadmap/.test(combined)) {
    category = 'product';
  }

  if (/urgent|asap|critical|emergency|down|outage|breach|data loss|immediately/.test(combined)) {
    priority = 'critical';
  } else if (/frustrat|angry|disappoint|terrible|horrible|worst|never/.test(combined)) {
    priority = 'high';
  }

  if (/frustrat|angry|upset|disappoint|terrible/.test(combined)) {
    sentiment = 'frustrated';
  } else if (/thank|appreciate|great|helpful|pleased/.test(combined)) {
    sentiment = 'satisfied';
  } else if (/confus|unclear|don't understand|what does/.test(combined)) {
    sentiment = 'confused';
  }

  return {
    category,
    priority,
    sentiment,
    confidence: 0.6,
    needsHumanReview: true,
    assignedTeam: category,
    suggestedReply: generateFallbackReply(ticket),
    churnRisk: sentiment === 'frustrated' ? 0.6 : 0.2,
  };
}

function generateFallbackReply(ticket: TicketData): string {
  return `Thank you for reaching out to us regarding "${ticket.subject}". Our team has received your request and is reviewing it. We will get back to you as soon as possible with an update. If this is urgent, please contact our support team directly.`;
}





