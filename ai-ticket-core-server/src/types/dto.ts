export interface CreateTicketDTO {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subject: string;
  message: string;
  sourceChannel?: string;
  customerTier?: string;
  createdByAgentId?: string;
}

export interface TicketQueryParams {
  status?: string;
  priority?: string;
  assignedTeamId?: string;
  assignedAgentId?: string;
  limit?: string;
  offset?: string;
}

export interface TicketUpdateData {
  status?: string;
  priority?: string;
  category?: string;
  assignedTeamId?: string;
  assignedAgentId?: string;
  needsHumanReview?: boolean;
  overrideReason?: string;
  updatedByAgentId?: string;
}

export interface TriageUpdateData {
  ticketId: string;
  category: string;
  priority: string;
  sentiment: string;
  assignedTeam: string;
  confidence: number;
  needsHumanReview: boolean;
  suggestedReply: string;
  modelUsed: string;
  churnRisk?: number;
}

export interface TeamUpdateData {
  name?: string;
  description?: string;
  skills?: string[];
  maxCapacity?: number;
  isActive?: boolean;
}

export interface CreateTeamDTO {
  name: string;
  description?: string;
  skills?: string[];
  maxCapacity?: number;
}

export interface AuditQueryParams {
  ticketId?: string;
  userId?: string;
  action?: string;
  limit?: string;
  offset?: string;
}
