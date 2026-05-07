import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import type { ParsedReceipt, ConfidenceFlags } from '../types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const SYSTEM_PROMPT = `You are a receipt OCR assistant. Extract structured data from receipt images.

Return ONLY valid JSON with no markdown, no backticks, no explanation.

Schema:
{
  "merchant": string | null,
  "date": "YYYY-MM-DD" | null,
  "line_items": [
    { "name": string, "amount": number }
  ],
  "total": number | null,
  "_notes": string | null
}

Rules for line_items:
- Include all purchased items with their prices
- Include tax as a line item named "Tax" if present
- Include tip as a line item named "Tip" if present  
- Include discounts as negative amounts named "Discount: <name>"
- DO NOT include subtotals (pre-tax totals) as line items — these are redundant
- amounts are always positive numbers EXCEPT discounts

If you cannot read a field clearly, return null for that field.
In _notes, mention anything unusual: blurry image, unusual format, conflicting totals, etc.`;

export interface ParseResult {
  parsed: ParsedReceipt;
  rawOutput: string;
  confidenceFlags: ConfidenceFlags;
}

function detectConfidenceIssues(
  parsed: ParsedReceipt,
  rawOutput: string,
  notes: string | null
): ConfidenceFlags {
  const flags: ConfidenceFlags = {};

  if (!parsed.merchant) flags.merchant_uncertain = true;
  if (!parsed.date) flags.date_uncertain = true;

  const hasNullFields =
    parsed.merchant === null || parsed.date === null || parsed.total === null;
  if (hasNullFields || parsed.line_items.length === 0) {
    flags.partial_parse = true;
  }

  if (parsed.line_items.length > 0 && parsed.total !== null) {
    const sum = parsed.line_items.reduce((acc, item) => acc + item.amount, 0);
    const diff = Math.abs(sum - parsed.total);
    // Allow 1% tolerance or $0.10 absolute
    if (diff > Math.max(0.1, parsed.total * 0.01)) {
      flags.total_mismatch = true;
    }
  }

  if (notes && /blurry|unclear|cannot read|poor quality|faded/i.test(notes)) {
    flags.low_quality_image = true;
  }

  return flags;
}

export async function parseReceiptImage(
  imageBuffer: Buffer,
  mimeType: 'image/jpeg' | 'image/png'
): Promise<ParseResult> {
  const base64Data = imageBuffer.toString('base64');

  const contents = [
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    { text: SYSTEM_PROMPT },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
  });

  const rawOutput = response.text ?? '';

  let parsed: ParsedReceipt & { _notes?: string | null };
  try {
    // Strip any accidental markdown fences
    const cleaned = rawOutput.replace(/```(?:json)?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // LLM returned non-JSON — return a partial parse with everything null
    return {
      parsed: { merchant: null, date: null, line_items: [], total: null },
      rawOutput,
      confidenceFlags: { partial_parse: true },
    };
  }

  // Sanitize: ensure types are correct
  const safe: ParsedReceipt = {
    merchant: typeof parsed.merchant === 'string' ? parsed.merchant : null,
    date: typeof parsed.date === 'string' ? parsed.date : null,
    line_items: Array.isArray(parsed.line_items)
      ? parsed.line_items.filter(
          (i) => typeof i.name === 'string' && typeof i.amount === 'number'
        )
      : [],
    total: typeof parsed.total === 'number' ? parsed.total : null,
  };

  const confidenceFlags = detectConfidenceIssues(safe, rawOutput, parsed._notes ?? null);

  return { parsed: safe, rawOutput, confidenceFlags };
}
