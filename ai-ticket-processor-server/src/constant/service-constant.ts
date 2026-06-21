const TRIAGE_CATEGORIES = {
    BILLING: 'billing',
    TECHNICAL: 'technical',
    ACCOUNT: 'account',
    PRODUCT: 'product',
    LEGAL: 'legal',
    OTHER: 'other',
} as const;

const TRIAGE_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
} as const;

const SENTIMENT = {
    POSITIVE: 'positive',
    NEUTRAL: 'neutral',
    NEGATIVE: 'negative',
} as const;

const PIPELINE_STAGES = {
    FETCH_TICKET: 'fetch_ticket',
    BUILD_PROMPT: 'build_prompt',
    LLM_ANALYSIS: 'llm_analysis',
    FALLBACK: 'fallback_rules',
    BUILD_RESULT: 'build_result',
    SAVE_RESULT: 'save_result',
} as const;

const FALLBACK_SIGNALS = {
    URGENT_KEYWORDS: ['urgent', 'asap', 'critical', 'down', 'outage', 'emergency'],
    BILLING_KEYWORDS: ['billing', 'charge', 'payment', 'invoice', 'refund', 'subscription'],
    TECHNICAL_KEYWORDS: ['error', 'bug', 'crash', 'fail', 'broken', '500', 'timeout'],
    ACCOUNT_KEYWORDS: ['login', 'password', 'access', 'account', 'locked', 'permission'],
} as const;

export { TRIAGE_CATEGORIES, TRIAGE_PRIORITY, SENTIMENT, PIPELINE_STAGES, FALLBACK_SIGNALS };
