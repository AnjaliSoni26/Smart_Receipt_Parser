# Receipt Parser

**The correction UX is the product.** AI extracts fast. Users verify and fix in seconds. That's it.

---

## What did you build?

A full-stack app where the core insight is: **correction is faster and better than perfection**. Upload a receipt → Gemini 3.1 Flash extracts (2–4s) → live preview with confidence flags and math validation → users edit inline with instant recalculation → save. The extraction is deliberately fast-but-imperfect. The UX catches what the AI misses.

**Edge cases are handled explicitly, not hidden:**
- **Bad/blurry image?** Flag it immediately. Let the user re-upload without wasting time fixing wrong data.
- **Malformed LLM output?** Fallback to partial parse (empty fields show as blanks). User sees exactly what failed.
- **Missing fields?** Show them as empty. User fills them in. Not "uncertain"—just empty.

---

## Quick Start

### Prerequisites

- Node.js 18+
- A running Postgres instance
- A Google Gemini API key

### Setup

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

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:3001

---

## The Correction UX (The Real Product)

### Upload & Preview
- Drag-and-drop or click to select a JPG/PNG receipt image
- Live side-by-side: original image on left, extracted data on right
- **Confidence flags appear immediately** if issues are detected
- User decides: "Confirm & Edit" or "Upload Different"

### Edit Flow
Every field is editable inline. The moment you change anything:
- **Total vs. items sum** is calculated live. Mismatch? Shown in red. User instantly sees the discrepancy and fixes it.
- **Add/remove line items** — totals recalculate. No hidden math.
- **Empty fields are visible** — if Gemini couldn't read the merchant, it's blank. User knows exactly what to fill in.
- Save only when there are actual changes (dirty flag prevents accident saves).

### Edge Case Handling

**1. Low-quality image**
- Flagged with "⚠️ Low image quality"
- User sees this before committing, can re-upload
- Doesn't block editing—user can fix manually if they want

**2. Partial extraction (missing fields)**
- Merchant = empty, Date = empty, Total = empty → all shown as blanks in the editor
- User fills them in manually. The form is ready; not "uncertain" or broken
- Flag shows "⚠️ Partial extraction" to signal something was missed

**3. Total ≠ sum of line items**
- Real-time indicator: "Items sum to $18.50" displayed under total
- Flagged as error (red background) so user doesn't miss it
- User fixes by editing items or the total — their choice

**4. Malformed LLM output (non-JSON)**
- Parser falls back to: `{ merchant: null, date: null, line_items: [], total: null }`
- Frontend shows empty form
- Confidence flag: "⚠️ Partial extraction"
- User starts fresh, isn't blocked

---

## Biggest tradeoffs and why?

**Gemini 3.1 Flash over GPT-4o or Claude:** Flash is fast (~2–4s) and cheap. It's wrong sometimes on blurry receipts. But wrong-and-fast beats perfect-and-slow because correction is free. If 90% is correct, the user fixes 10% in 30 seconds. If perfect takes twice as long to extract, you've lost.

**Confidence flags (heuristic) instead of confidence scores:** No API for per-field confidence, so I derive it: null = uncertain, sum mismatch = flagged, blurry keywords = low quality. It's imperfect. But showing users *what to verify* without a second LLM call is worth the imprecision.

**Subtotals excluded:** Mathematically redundant (sum of items above). Inclusion would fire mismatch detector constantly. Users trust the UI more when it doesn't cry wolf.

---

## Where exactly did you use an LLM?

- **Gemini 3.1 Flash** → Receipt image (base64) + structured system prompt → JSON extraction
- **Claude Sonnet** → Prompt tuning (edge cases, line item rules, notes format)
- **Everything else** → Manual: error recovery, confidence logic, mismatch detection, correction UX, React components

---

## What would you do with another week?

1. **Re-parse with context button** — If extraction is badly wrong, user hits "Try Again" → Gemini gets the image + the previous extraction + user's feedback ("date is in bottom right"). Dramatically faster than manual fix.

2. **Export to CSV/JSON** — Users want to download their corrected receipts for expense tracking.

3. **Undo/redo in the editor** — Users make quick edits; undo stack keeps them confident (not afraid of mistakes).

---

## What would you push back on as a PM?

"The correction flow is the most important part"—yes. But it's only as good as the user's ability to spot what's wrong. **Without the side-by-side image preview in the editor, you're asking users to verify from memory.** 

A user sees:
- Merchant: Starbucks
- Total: $18.50

They can't verify this against the original unless they remember. They might save wrong data. The confidence flags catch *some* problems, but not all (a correct null looks identical to an unread field).

**Fix:** Keep the receipt image visible in the edit screen too, not just the upload preview. That one change makes the UX 10x stronger. Users spot errors instantly. Corrections take seconds.
