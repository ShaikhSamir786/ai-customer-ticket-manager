import { sequelize } from '../src/sequelize-client';
import { undoLastMigration } from '../src/migrations';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    await undoLastMigration(sequelize);
  } catch (error) {
    console.error('Migration undo failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
