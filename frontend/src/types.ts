export interface LineItem {
  name: string;
  amount: number;
}

export interface ConfidenceFlags {
  low_quality_image?: boolean;
  merchant_uncertain?: boolean;
  date_uncertain?: boolean;
  total_mismatch?: boolean;
  partial_parse?: boolean;
}

export interface Receipt {
  id: string;
  merchant: string | null;
  date: string | null;
  line_items: LineItem[];
  total: number | null;
  raw_llm_output: string | null;
  image_filename: string | null;
  confidence_flags: ConfidenceFlags;
  created_at: string;
  updated_at: string;
}
