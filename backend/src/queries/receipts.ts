import { pool } from '../db/client.js';
import type { Receipt, ParsedReceipt, ConfidenceFlags } from '../types.js';

export async function insertReceipt(
  parsed: ParsedReceipt,
  rawOutput: string | null,
  imageFilename: string | null,
  confidenceFlags: ConfidenceFlags
): Promise<Receipt> {
  const { rows } = await pool.query<Receipt>(
    `INSERT INTO receipts (merchant, date, line_items, total, raw_llm_output, image_filename, confidence_flags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      parsed.merchant,
      parsed.date,
      JSON.stringify(parsed.line_items),
      parsed.total,
      rawOutput,
      imageFilename,
      JSON.stringify(confidenceFlags),
    ]
  );
  return rows[0];
}

export async function getAllReceipts(): Promise<Receipt[]> {
  const { rows } = await pool.query<Receipt>(
    `SELECT * FROM receipts ORDER BY created_at DESC`
  );
  return rows;
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const { rows } = await pool.query<Receipt>(
    `SELECT * FROM receipts WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateReceipt(
  id: string,
  updates: Partial<ParsedReceipt>
): Promise<Receipt | null> {
  // Build dynamic SET clause for only provided fields
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.merchant !== undefined) {
    fields.push(`merchant = $${idx++}`);
    values.push(updates.merchant);
  }
  if (updates.date !== undefined) {
    fields.push(`date = $${idx++}`);
    values.push(updates.date);
  }
  if (updates.line_items !== undefined) {
    fields.push(`line_items = $${idx++}`);
    values.push(JSON.stringify(updates.line_items));
  }
  if (updates.total !== undefined) {
    fields.push(`total = $${idx++}`);
    values.push(updates.total);
  }

  if (fields.length === 0) return getReceiptById(id);

  values.push(id);
  const { rows } = await pool.query<Receipt>(
    `UPDATE receipts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteReceipt(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM receipts WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}
