const MODEL_TABLE_NAMES = {
    TEAMS: 'teams',
    USERS: 'users',
    TICKETS: 'tickets',
    TICKET_MESSAGES: 'ticket_messages',
    OVERRIDE_HISTORY: 'override_history',
    AUDIT_LOGS: 'audit_logs',
    SLA_POLICIES: 'sla_policies',
    PROMPT_TEMPLATES: 'prompt_templates',
    WEBHOOK_SUBSCRIPTIONS: 'webhook_subscriptions',
    EMPLOYEES: 'employees',
} as const;

const MIGRATION = {
    TABLE: 'SequelizeMeta',
    DIR: '../schema/main-server/migrations',
} as const;

const DEFAULT_PAGINATION = {
    LIMIT: 50,
    MAX_LIMIT: 1000,
    OFFSET: 0,
} as const;

export { MODEL_TABLE_NAMES, MIGRATION, DEFAULT_PAGINATION };
