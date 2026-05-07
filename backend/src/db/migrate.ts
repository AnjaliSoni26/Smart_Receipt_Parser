import 'dotenv/config';
import { pool } from './client.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant VARCHAR(255),
        date DATE,
        line_items JSONB NOT NULL DEFAULT '[]',
        total NUMERIC(10, 2),
        raw_llm_output TEXT,
        image_filename VARCHAR(255),
        confidence_flags JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS receipts_updated_at ON receipts;

      CREATE TRIGGER receipts_updated_at
        BEFORE UPDATE ON receipts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);
    console.log('✅ Migration complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
