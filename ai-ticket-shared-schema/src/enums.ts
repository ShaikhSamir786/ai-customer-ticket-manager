export enum TicketStatus {
  PENDING = 'pending',
  TRIAGING = 'triaging',
  TRIAGED = 'triaged',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
  ERROR_REQUIRES_MANUAL = 'error_requires_manual',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketCategory {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  PRODUCT = 'product',
  LEGAL = 'legal',
  OTHER = 'other',
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  CUSTOMER = 'customer',
}

export enum Department {
  TECHNICAL_SUPPORT = 'technical_support',
  FINANCE_SUPPORT = 'finance_support',
  ACCOUNT_MANAGEMENT = 'account_management',
  PRODUCT_SUPPORT = 'product_support',
  LEGAL = 'legal',
  SALES = 'sales',
  CUSTOMER_SUCCESS = 'customer_success',
}
