import { QueryInterface, Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';

const MIGRATIONS_TABLE = 'SequelizeMeta';

async function getExecutedMigrations(sequelize: Sequelize): Promise<Set<string>> {
  const queryInterface = sequelize.getQueryInterface();
  const exists = await queryInterface.tableExists(MIGRATIONS_TABLE);
  if (!exists) {
    await queryInterface.createTable(MIGRATIONS_TABLE, {
      name: { type: 'VARCHAR(255)', primaryKey: true, allowNull: false },
    });
    return new Set();
  }
  const [rows] = await sequelize.query(`SELECT name FROM "${MIGRATIONS_TABLE}" ORDER BY name`);
  return new Set((rows as any[]).map(r => r.name));
}

function loadMigrationFiles(migrationsDir: string): { name: string; up: Function; down: Function }[] {
  if (!fs.existsSync(migrationsDir)) return [];
  const files = fs.readdirSync(migrationsDir)
    .filter(f => (f.endsWith('.ts') && !f.endsWith('.d.ts')) || f.endsWith('.js'))
    .sort();
  return files.map((file) => {
    const migration = require(path.join(migrationsDir, file));
    return { name: file, up: migration.up, down: migration.down };
  });
}

export async function runMigrations(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const migrationsDir = path.resolve(__dirname, '../schema/main-server/migrations');
  const executed = await getExecutedMigrations(sequelize);
  const pending: { name: string; up: Function }[] = [];

  for (const migration of loadMigrationFiles(migrationsDir)) {
    if (!executed.has(migration.name)) {
      pending.push(migration);
    }
  }

  pending.sort((a, b) => a.name.localeCompare(b.name));

  for (const migration of pending) {
    await migration.up(queryInterface, Sequelize);
    await sequelize.query(`INSERT INTO "${MIGRATIONS_TABLE}" (name) VALUES (?)`, {
      replacements: [migration.name],
    });
    console.log(`Migration applied: ${migration.name}`);
  }

  if (pending.length === 0) {
    console.log('No pending migrations.');
  }
}

export async function undoLastMigration(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const migrationsDir = path.resolve(__dirname, '../schema/main-server/migrations');
  const executed = await getExecutedMigrations(sequelize);

  if (executed.size === 0) {
    console.log('No migrations to undo.');
    return;
  }

  const lastMigrationName = [...executed].sort().pop()!;
  const migration = require(path.join(migrationsDir, lastMigrationName));
  if (migration.down) {
    await migration.down(queryInterface, Sequelize);
  }
  await sequelize.query(`DELETE FROM "${MIGRATIONS_TABLE}" WHERE name = ?`, {
    replacements: [lastMigrationName],
  });
  console.log(`Migration reverted: ${lastMigrationName}`);
}
