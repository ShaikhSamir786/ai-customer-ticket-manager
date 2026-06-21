const PROVIDER_NAMES = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    OLLAMA: 'ollama',
} as const;

const DEFAULT_MODELS = {
    OPENAI: 'gpt-4-turbo',
    ANTHROPIC: 'claude-3-opus-20240229',
    OLLAMA: 'llama3',
} as const;

const PROVIDER_DEFAULTS = {
    TEMPERATURE: 0.3,
    MAX_TOKENS: 2000,
} as const;

const PROMPT_TEMPLATE_NAMES = {
    TRIAGE_CLASSIFICATION: 'triage-classification',
    TRIAGE_PRIORITY: 'triage-priority',
    TRIAGE_REPLY: 'triage-reply',
} as const;

export { PROVIDER_NAMES, DEFAULT_MODELS, PROVIDER_DEFAULTS, PROMPT_TEMPLATE_NAMES };
