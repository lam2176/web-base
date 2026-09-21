import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgresImport from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';
config();

const postgres = (postgresImport as any).default || postgresImport;
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

export const client = postgres(connectionString, {
  max: 10,
  onnotice: () => {}, // Suppress notices
  prepare: false, // Disable prepared statements
  connection: {
    application_name: 'nextshop-backend',
  },
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
