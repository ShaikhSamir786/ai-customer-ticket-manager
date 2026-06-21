/**
 * Strongly-typed interfaces for the JSONB columns scattered across models.
 *
 * These are exported for consumers that want typed access to the metadata
 * payloads. The model classes still declare the columns loosely (e.g.
 * `Record<string, unknown>`); callers can narrow via these types or via zod
 * parsing at the service boundary.
 */

/** Metadata captured when a ticket's override or triage result is recorded. */
export interface OverrideAuditMetadata {
  readonly changes?: Record<string, unknown>;
  readonly triage?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

/** Metadata for a dead-letter / triage-failure audit entry. */
export interface DeadLetterMetadata {
  readonly error: string;
  readonly [key: string]: unknown;
}

/** Metadata for an SLA-breach audit entry. */
export interface SlaBreachMetadata {
  readonly breachedAt: string;
  readonly thresholdMs: number;
  readonly [key: string]: unknown;
}

/** Skills / profile payload stored on the Employee model. */
export interface EmployeeSkills {
  readonly skills: string[];
  readonly languages: string[];
  readonly certifications: string[];
  readonly yearsOfExperience: number;
  readonly [key: string]: unknown;
}

/** Metrics payload stored on the PromptTemplate model. */
export interface PromptTemplateMetrics {
  readonly invocations?: number;
  readonly avgTokens?: number;
  readonly avgLatencyMs?: number;
  readonly successRate?: number;
  readonly [key: string]: unknown;
}
