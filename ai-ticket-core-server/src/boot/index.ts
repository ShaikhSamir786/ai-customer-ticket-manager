import { runMigrations, sequelize } from '@ai-ticket/shared-schema';
import { seedDefaultEmployees } from './seed-default-employees';
import { logger } from '../logger';

export async function bootstrap(): Promise<void> {
  logger.info('Starting server bootstrap...');

  await sequelize.authenticate();
  logger.info('Database connected');

  await runMigrations(sequelize);
  logger.info('Migrations applied');

  await seedDefaultEmployees();

  logger.info('Bootstrap completed');
}
