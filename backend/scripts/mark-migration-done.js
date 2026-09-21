const postgres = require('postgres');
require('dotenv').config();

async function markMigrationDone() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Check if migration already marked
    const result = await sql`
      SELECT hash 
      FROM drizzle.__drizzle_migrations 
      WHERE hash = '0020_left_omega_red'
    `;

    if (result.length > 0) {
      console.log('Migration 0020 already marked as done');
      return;
    }

    // Mark migration as done (created_at is bigint timestamp)
    const timestamp = Date.now();
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0020_left_omega_red', ${timestamp})
    `;

    console.log('Successfully marked migration 0020 as done');
  } catch (error) {
    console.error('Error marking migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

markMigrationDone();
