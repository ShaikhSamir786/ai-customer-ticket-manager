import 'reflect-metadata';
import sequelize from './config';
import {
  Team, User, Ticket, TicketMessage,
  OverrideHistory, AuditLog, SLAPolicy,
  PromptTemplate, WebhookSubscription, Employee,
} from './models';
import { runMigrations, undoLastMigration } from './migrations';
import { runSeeders } from './seeders';

const models = {
  Team, User, Ticket, TicketMessage,
  OverrideHistory, AuditLog, SLAPolicy,
  PromptTemplate, WebhookSubscription, Employee,
};

sequelize.addModels(Object.values(models));

/**
 * Initialize the database: authenticate, run pending migrations, apply seeders.
 *
 * Errors are logged AND re-thrown so callers (e.g. `bootstrap()` in each
 * service) can fail fast and trigger a non-zero exit. Previously this swallowed
 * errors silently, masking startup failures.
 */
async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    await runMigrations(sequelize);
    await runSeeders();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export { sequelize, initializeDatabase, runMigrations, undoLastMigration, runSeeders };
export { getSequelize } from './config';
export * from './enums';
export * from './models';
export { default as sequelizeInstance } from './config';
export { Op, fn, col, literal } from 'sequelize';
export { default as sequelizeClient } from './sequelize-client';
export type {
  OverrideAuditMetadata,
  DeadLetterMetadata,
  SlaBreachMetadata,
  EmployeeSkills,
  PromptTemplateMetrics,
} from './types/jsonb.types';
export { MODEL_TABLE_NAMES, MIGRATION, DEFAULT_PAGINATION } from './constant/service-constant';
export default sequelize;
