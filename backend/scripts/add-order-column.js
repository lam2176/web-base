const postgres = require('postgres');
require('dotenv').config();

async function addOrderColumn() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Check if column already exists
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pages' AND column_name = 'order'
    `;

    if (result.length > 0) {
      console.log('Column "order" already exists in pages table');
      return;
    }

    // Add the column
    await sql`
      ALTER TABLE pages 
      ADD COLUMN "order" integer DEFAULT 0 NOT NULL
    `;

    console.log('Successfully added "order" column to pages table');
  } catch (error) {
    console.error('Error adding order column:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addOrderColumn();

