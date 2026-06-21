export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  teamId?: string;
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  customerId?: string;
  source?: string;
}

export interface UpdateTicketInput {
  status?: string;
  priority?: string;
  category?: string;
  assignedTeam?: string;
  assignedAgentId?: string;
  confidence?: number;
  needsHumanReview?: boolean;
  suggestedReply?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority?: string;
  category?: string;
  assignedTeam?: string;
  assignedAgentId?: string;
  createdByAgentId?: string;
  customerId?: string;
  source?: string;
  confidence?: number;
  needsHumanReview?: boolean;
  suggestedReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResult {
  tickets: Ticket[];
  total: number;
  limit: number;
  offset: number;
  page: number;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    teamId?: string;
  };
}
