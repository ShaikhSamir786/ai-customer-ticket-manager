import { sequelize } from '../src/sequelize-client';
import { runMigrations } from '../src/migrations';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    await runMigrations(sequelize);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
