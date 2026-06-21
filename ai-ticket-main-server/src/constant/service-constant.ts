const SERVICE_ENDPOINTS = {
    AUTH_VERIFY: '/v1/auth/verify',
    AUTH_REGISTER: '/v1/auth/register',
    TICKETS: '/v1/tickets',
    TICKET_BY_ID: '/v1/tickets/',
} as const;

const AUDIT_ACTION = {
    LOGIN: 'auth.login',
    REGISTER: 'auth.register',
    TICKET_CREATED: 'ticket.created',
    TICKET_UPDATED: 'ticket.updated',
} as const;

const AUTH_SCHEME = {
    BEARER: 'Bearer ',
} as const;

const GRAPHQL = {
    BASE_TYPES: 'base.graphql',
    USER_SDL: 'user/user.graphql',
    TICKET_SDL: 'ticket/ticket.graphql',
} as const;

export { SERVICE_ENDPOINTS, AUDIT_ACTION, AUTH_SCHEME, GRAPHQL };
