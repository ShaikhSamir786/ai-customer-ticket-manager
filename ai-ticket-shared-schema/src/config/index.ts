import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME || 'ai_ticket';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_POOL_MIN = parseInt(process.env.DB_POOL_MIN || '2', 10);
const DB_POOL_MAX = parseInt(process.env.DB_POOL_MAX || '10', 10);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    min: DB_POOL_MIN,
    max: DB_POOL_MAX,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
});

export default sequelize;
export { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_POOL_MIN, DB_POOL_MAX };
