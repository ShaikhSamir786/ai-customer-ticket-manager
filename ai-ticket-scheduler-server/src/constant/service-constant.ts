const STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    WAITING_CUSTOMER: 'waiting_customer',
    ERROR_REQUIRES_MANUAL: 'error_requires_manual',
    CLOSED: 'closed',
    TRIAGING: 'triaging',
    ASSIGNED: 'assigned',
} as const;

const AUDIT_ACTION = {
    SLA_BREACHED: 'sla.breached',
    METRICS_SNAPSHOT: 'metrics.snapshot',
    TRIAGE_DEAD_LETTER: 'triage.dead_letter',
} as const;

const AUDIT_ENTITY = {
    TICKET: 'ticket',
    SYSTEM: 'system',
} as const;

const DEFAULT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 1000,
    },
    timeout: 30000,
    removeOnComplete: 100,
    removeOnFail: 500,
} as const;

export { STATUS, AUDIT_ACTION, AUDIT_ENTITY, DEFAULT_JOB_OPTIONS };
