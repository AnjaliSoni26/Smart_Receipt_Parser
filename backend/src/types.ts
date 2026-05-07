export interface LineItem {
  name: string;
  amount: number;
}

export interface ParsedReceipt {
  merchant: string | null;
  date: string | null; // YYYY-MM-DD
  line_items: LineItem[];
  total: number | null;
}

export interface ConfidenceFlags {
  low_quality_image?: boolean;
  merchant_uncertain?: boolean;
  date_uncertain?: boolean;
  total_mismatch?: boolean; // sum of line items != total
  partial_parse?: boolean;   // some fields missing
}

export interface Receipt extends ParsedReceipt {
  id: string;
  raw_llm_output: string | null;
  image_filename: string | null;
  confidence_flags: ConfidenceFlags;
  created_at: string;
  updated_at: string;
}
