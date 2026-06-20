export const QUEUE_NAMES = {
  TICKET_TRIAGE: 'ticket-triage',
  TICKET_EVENTS: 'ticket-events',
  WEBHOOK_DELIVERY: 'webhook-delivery',
  METRICS_AGGREGATION: 'metrics-aggregation',
  OVERRIDE_EVENTS: 'override-events',
} as const;

export const JOB_NAMES = {
  PROCESS_TICKET: 'process-ticket',
  RETRY_TRIAGE: 'retry-triage',
  SLA_CHECK: 'sla-check',
  STALE_TICKET_SCAN: 'stale-ticket-scan',
  WEBHOOK_SEND: 'webhook-send',
  METRICS_COMPUTE: 'metrics-compute',
} as const;

export const EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_RESOLVED: 'ticket.resolved',
  TICKET_ESCALATED: 'ticket.escalated',
  OVERRIDE_CREATED: 'override.created',
  SLA_BREACHED: 'sla.breached',
} as const;


