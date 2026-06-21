const STATUS = {
    PENDING: 'pending',
    TRIAGING: 'triaging',
    TRIAGED: 'triaged',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    WAITING_CUSTOMER: 'waiting_customer',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    ESCALATED: 'escalated',
    ERROR_REQUIRES_MANUAL: 'error_requires_manual',
} as const;

const AUDIT_ACTION = {
    TICKET_CREATED: 'ticket.created',
    TICKET_UPDATED: 'ticket.updated',
    TICKET_TRIAGED: 'ticket.triaged',
    SLA_BREACHED: 'sla.breached',
    METRICS_SNAPSHOT: 'metrics.snapshot',
} as const;

const AUDIT_ENTITY = {
    TICKET: 'ticket',
    TEAM: 'team',
    USER: 'user',
    SYSTEM: 'system',
} as const;

const JOB_NAMES = {
    PROCESS_TICKET: 'process-ticket',
    RETRY_TRIAGE: 'retry-triage',
} as const;

export { STATUS, AUDIT_ACTION, AUDIT_ENTITY, JOB_NAMES };
