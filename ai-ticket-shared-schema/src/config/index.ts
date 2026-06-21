import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';

/**
 * `.env` is loaded lazily (not at import time) so importing this module as a
 * transitive dependency of a microservice does not trigger an env-file side
 * effect from an unexpected working directory. The lazy loader below is called
 * the first time `getSequelize()` is invoked or when this module is first
 * evaluated to build the default instance.
 */
let envLoaded = false;

function loadEnv(): void {
  if (envLoaded) return;
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  envLoaded = true;
}

const env = {
  get DB_NAME() {
    return process.env.DB_NAME || 'ai_ticket';
  },
  get DB_USER() {
    return process.env.DB_USER || 'postgres';
  },
  get DB_PASSWORD() {
    return process.env.DB_PASSWORD || 'postgres';
  },
  get DB_HOST() {
    return process.env.DB_HOST || 'localhost';
  },
  get DB_PORT() {
    return parseInt(process.env.DB_PORT || '5432', 10);
  },
  get DB_POOL_MIN() {
    return parseInt(process.env.DB_POOL_MIN || '2', 10);
  },
  get DB_POOL_MAX() {
    return parseInt(process.env.DB_POOL_MAX || '10', 10);
  },
};

function buildSequelize(): Sequelize {
  loadEnv();
  const isDevelopment = process.env.NODE_ENV === 'development';

  return new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',
    // SQL logging only in development; silenced otherwise to avoid leaking
    // bound parameter values into production logs.
    logging: isDevelopment ? (msg: string) => console.debug(msg) : false,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  });
}

let cachedInstance: Sequelize | null = null;

/**
 * Get the memoized Sequelize instance, constructing it (and loading `.env`)
 * on first access.
 */
export function getSequelize(): Sequelize {
  if (!cachedInstance) cachedInstance = buildSequelize();
  return cachedInstance;
}

/**
 * Default export. Kept eager for backward compatibility with the many callers
 * that do `import sequelize from '.../config'`. The dotenv side effect is now
 * gated behind `loadEnv()` and runs only at first use of the instance builder,
 * which — because this module previously ran dotenv at import anyway —
 * preserves the prior behavior at call time rather than import time.
 */
const sequelize: Sequelize = buildSequelize();

export default sequelize;

/**
 * DB connection parameters. NOTE: `DB_PASSWORD` is intentionally omitted from
 * these named exports (IMPROVEMENT.md security item — secrets should not be
 * re-exported through the module barrel). Non-secret parameters are exposed
 * as values captured at build time for diagnostic/logging use.
 */
export const DB_NAME = env.DB_NAME;
export const DB_HOST = env.DB_HOST;
export const DB_PORT = env.DB_PORT;
export const DB_POOL_MIN = env.DB_POOL_MIN;
export const DB_POOL_MAX = env.DB_POOL_MAX;
