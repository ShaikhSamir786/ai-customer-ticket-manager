export interface TicketData {
  id: string;
  subject: string;
  message: string;
  customerTier: string;
  sourceChannel: string;
}

export interface LLMAnalysisResult {
  category: string;
  priority: string;
  sentiment: string;
  assignedTeam: string;
  confidence: number;
  needsHumanReview: boolean;
  suggestedReply: string;
  churnRisk: number;
}

export interface TriageResult {
  ticketId: string;
  category: string;
  priority: string;
  sentiment: string;
  assignedTeam: string;
  confidence: number;
  needsHumanReview: boolean;
  suggestedReply: string;
  modelUsed: string;
  churnRisk: number;
  timestamp: string;
}

export interface ProcessTicketResponse {
  ticketId: string;
  category: string;
  priority: string;
  sentiment: string;
  assignedTeam: string;
  confidence: number;
  needsHumanReview: boolean;
  suggestedReply: string;
  modelUsed: string;
  churnRisk: number;
  timestamp: string;
}
