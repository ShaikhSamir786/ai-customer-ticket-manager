import 'reflect-metadata';
import sequelize from './config';
import {
  Team, User, Ticket, TicketMessage,
  OverrideHistory, AuditLog, SLAPolicy,
  PromptTemplate, WebhookSubscription, Employee,
} from './models';
import { runMigrations } from './migrations';
import { runSeeders } from './seeders';

const models = {
  Team, User, Ticket, TicketMessage,
  OverrideHistory, AuditLog, SLAPolicy,
  PromptTemplate, WebhookSubscription, Employee,
};

sequelize.addModels(Object.values(models));

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await runMigrations(sequelize);
    await runSeeders();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export { sequelize, initializeDatabase, runMigrations, runSeeders };
export * from './enums';
export * from './models';
export { default as sequelizeInstance } from './config';
export { Op, fn, col, literal } from 'sequelize';
export { default as sequelizeClient } from './sequelize-client';
export default sequelize;
