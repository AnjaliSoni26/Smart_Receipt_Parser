# Receipt Parser

A full-stack web app that turns a photo of a receipt into structured, editable data — using Gemini Vision for OCR and Postgres for persistence.

## What did you build?

A two-part app: a TypeScript/Express backend that accepts a receipt image, sends it to Gemini 2.0 Flash for structured extraction (merchant, date, line items, total), flags potential quality issues, and saves the result to Postgres. A React frontend that lets you upload images, review what the LLM extracted — with visual warnings on fields it wasn't confident about — edit any field inline, and save corrections. The correction UX is the center of gravity: every uncertain field is highlighted, mismatches between the sum of line items and the stated total are surfaced explicitly, and deleted/added items are immediately reflected in a live recalculation.

---

## Setup

### Prerequisites

- Node.js 18+
- A running Postgres instance
- A Google Gemini API key

### Environment

```bash
# backend/.env (copy from backend/.env.example)
GOOGLE_API_KEY=your_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/receipt_parser
PORT=3001
```

### Run

```bash
# From project root — installs deps, migrates DB, starts both servers
npm install
npm run install:all
npm run db:migrate
npm run dev
```

Frontend → http://localhost:5173  
Backend → http://localhost:3001

---

## Biggest tradeoffs

**1. Gemini 2.0 Flash over GPT-4o or Claude**  
Flash is fast (~2–4s for a receipt image) and cheap, which matters for a product where users will upload casually and expect near-instant feedback. Accuracy is slightly lower than the frontier models on complex or blurry receipts — but since users are correcting the output anyway, getting *something reasonable* quickly beats getting *something perfect* slowly. The correction UX is designed to catch what the model misses, not to avoid the problem.

**2. Confidence flags instead of confidence scores**  
The model doesn't return per-field confidence scores, so I derive them heuristically: null fields = uncertain, sum-vs-total mismatch = flagged, certain keywords in the model's `_notes` field = low quality. This is imperfect — a correctly-parsed null is treated the same as an unreadable field — but it surfaces the right things for the user to review without requiring a second LLM call to assess the first one's output.

**3. Subtotals excluded from line items**  
A deliberate product decision: subtotals (pre-tax amounts) are arithmetically redundant — they're just the sum of the items above them. Including them would make the total-vs-sum mismatch detector fire constantly and confuse users. Tax and tip *are* included as named line items because they represent real money flows the user might want to track. Discounts are included as negative amounts. If I were wrong about this, a user could always add a line item manually.

---

## Where I used an LLM

- **Gemini 2.0 Flash**: The core vision model — sends the receipt image as base64 with a structured prompt and returns JSON. The prompt specifies the exact schema, tells the model to exclude subtotals, surface discounts as negatives, and write `_notes` when the image is unclear.
- **Claude (Sonnet)**: Used for rapid prompt iteration on the extraction prompt — specifically tuning the `_notes` instruction and the line item rules. Also scaffolded the initial Postgres schema with it.
- Everything else — API structure, frontend components, the confidence flag logic, the mismatch detector — written manually.

---

## What I'd do with another week

1. **Receipt image preview in the editor** — the user is reviewing extracted data but can't see the original image to verify. That's the most glaring gap in the current correction UX. Storing images in S3 or on disk and displaying them side-by-side would make corrections dramatically faster.
2. **Re-parse button** — if the extraction is badly wrong (blurry image), the user currently has to fix everything manually. A "try again" that re-sends to Gemini with a note ("the first extraction missed the date — it's on the bottom right") would save a lot of effort.
3. **Export** — CSV or JSON download of saved receipts. Obvious for expense tracking use cases.
4. **Better error recovery on malformed JSON** — currently if Gemini returns garbled output, the whole extraction fails. A fallback regex pass to rescue at least the total would be worth adding.

---

## One thing I'd push back on

The spec says "the correction flow is the most important part" — and I agree, but the framing implies the LLM output is always the source of truth that the user corrects *down from*. That's backwards for low-quality images: sometimes the model returns confident-looking but wrong data, and the user has no signal that something needs fixing.

I'd push for the product to show the original image alongside the extracted fields — not just flag uncertain ones. Without that, a user who trusts the interface might save wrong data without noticing. The correction UX is only as good as the user's ability to spot what's wrong, and right now we're asking them to do that from memory.

The flag system I built is a partial mitigation, but the real fix is the side-by-side view.
