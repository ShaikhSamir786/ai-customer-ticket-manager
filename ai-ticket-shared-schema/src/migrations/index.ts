import { QueryInterface, Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { MIGRATION } from '../constant/service-constant';

const MIGRATIONS_TABLE = MIGRATION.TABLE;

/** Shape of a row in the SequelizeMeta tracking table. */
interface MigrationMetaRow {
  name: string;
}

/** Shape of a migration module loaded dynamically. */
interface MigrationModule {
  // The second argument is the Sequelize *class* (for DataTypes / static
  // helpers), matching the standard sequelize-cli migration signature used
  // by the migration files in this repo.
  up: (queryInterface: QueryInterface, SequelizeStatic: typeof Sequelize) => Promise<void>;
  down?: (queryInterface: QueryInterface, SequelizeStatic: typeof Sequelize) => Promise<void>;
}

/** Log helper: gated behind NODE_ENV so production stays quiet. */
function log(message: string): void {
  if (process.env.NODE_ENV !== 'test') {
    console.debug(message);
  }
}

async function getExecutedMigrations(sequelize: Sequelize): Promise<Set<string>> {
  const queryInterface = sequelize.getQueryInterface();
  const exists = await queryInterface.tableExists(MIGRATIONS_TABLE);
  if (!exists) {
    await queryInterface.createTable(MIGRATIONS_TABLE, {
      name: { type: 'VARCHAR(255)', primaryKey: true, allowNull: false },
    });
    return new Set();
  }
  const [rows] = await sequelize.query(
    `SELECT name FROM "${MIGRATIONS_TABLE}" ORDER BY name`,
  );
  return new Set((rows as MigrationMetaRow[]).map((r) => r.name));
}

function loadMigrationFiles(migrationsDir: string): MigrationModule[] {
  if (!fs.existsSync(migrationsDir)) return [];
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => (f.endsWith('.ts') && !f.endsWith('.d.ts')) || f.endsWith('.js'))
    .sort();
  return files.map((file) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(path.join(migrationsDir, file)) as MigrationModule;
    return { name: file, up: migration.up, down: migration.down } as MigrationModule & {
      name: string;
    };
  }) as MigrationModule[];
}

export async function runMigrations(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const migrationsDir = path.resolve(__dirname, '../schema/main-server/migrations');
  const executed = await getExecutedMigrations(sequelize);
  const pending: (MigrationModule & { name: string })[] = [];

  for (const migration of loadMigrationFiles(migrationsDir)) {
    const named = migration as MigrationModule & { name: string };
    if (!executed.has(named.name)) {
      pending.push(named);
    }
  }

  pending.sort((a, b) => a.name.localeCompare(b.name));

  for (const migration of pending) {
    await migration.up(queryInterface, Sequelize);
    await sequelize.query(`INSERT INTO "${MIGRATIONS_TABLE}" (name) VALUES (?)`, {
      replacements: [migration.name],
    });
    log(`Migration applied: ${migration.name}`);
  }

  if (pending.length === 0) {
    log('No pending migrations.');
  }
}

export async function undoLastMigration(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const migrationsDir = path.resolve(__dirname, '../schema/main-server/migrations');
  const executed = await getExecutedMigrations(sequelize);

  if (executed.size === 0) {
    log('No migrations to undo.');
    return;
  }

  const lastMigrationName = [...executed].sort().pop() as string;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const migration = require(path.join(migrationsDir, lastMigrationName)) as MigrationModule;
  if (migration.down) {
    await migration.down(queryInterface, Sequelize);
  }
  await sequelize.query(`DELETE FROM "${MIGRATIONS_TABLE}" WHERE name = ?`, {
    replacements: [lastMigrationName],
  });
  log(`Migration reverted: ${lastMigrationName}`);
}
