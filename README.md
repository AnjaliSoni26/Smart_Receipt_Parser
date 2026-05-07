# Receipt Parser

**Turn photos of receipts into structured data in seconds.** Upload an image. Get instant AI extraction. Fix what's wrong. Save to Postgres.

Built with TypeScript, React, Gemini 3.1 Flash, and Postgres—designed around a powerful correction workflow that catches what the AI misses.

---

## Why This Matters

**The Problem:** Receipts are unstructured images. Digitizing them requires careful manual entry or building complex OCR pipelines. Neither scales.

**The Solution:** Feed a receipt photo to Gemini 3.1 Flash. Get back merchant, date, line items, and total in milliseconds. Review the extracted data with visual confidence flags highlighting uncertain fields. Edit inline. Save corrected data. Done.

The magic is in the **correction-first UX**—the app assumes the AI will be imperfect (especially on blurry or complex receipts) and makes fixing errors trivial, not finding them a puzzle.

---

## Key Features

✅ **AI-Powered Extraction** — Gemini 3.1 Flash processes receipt images in 2–4 seconds  
✅ **Smart Confidence Flagging** — Visual warnings on uncertain fields, detected sum-vs-total mismatches  
✅ **Live Correction Workflow** — Edit any field inline; totals recalculate instantly  
✅ **Persistent Storage** — All corrections saved to Postgres  
✅ **Full-Stack TypeScript** — Express backend + React frontend, type-safe end-to-end  

---

## How It Works

1. **Upload** a receipt image via the frontend
2. **Extract** — Backend sends image to Gemini 3.1 Flash with a structured prompt
3. **Review** — Frontend highlights uncertain extractions and math mismatches
4. **Correct** — Edit fields inline with live validation
5. **Save** — Corrected receipt stored in Postgres

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

## Technical Approach

## Design Decisions

Why these choices? Because shipping fast with good UX beats pursuing perfection in the wrong direction.

**1. Gemini 3.1 Flash Preview over GPT-4o or Claude**  
Flash is fast (~2–4s for a receipt image) and cheap, which matters for a product where users will upload casually and expect near-instant feedback. Accuracy is slightly lower than the frontier models on complex or blurry receipts — but since users are correcting the output anyway, getting *something reasonable* quickly beats getting *something perfect* slowly. The correction UX is designed to catch what the model misses, not to avoid the problem.

**2. Confidence flags instead of confidence scores**  
The model doesn't return per-field confidence scores, so I derive them heuristically: null fields = uncertain, sum-vs-total mismatch = flagged, certain keywords in the model's `_notes` field = low quality. This is imperfect — a correctly-parsed null is treated the same as an unreadable field — but it surfaces the right things for the user to review without requiring a second LLM call to assess the first one's output.

**3. Subtotals excluded from line items**  
A deliberate product decision: subtotals (pre-tax amounts) are arithmetically redundant — they're just the sum of the items above them. Including them would make the total-vs-sum mismatch detector fire constantly and confuse users. Tax and tip *are* included as named line items because they represent real money flows the user might want to track. Discounts are included as negative amounts. If I were wrong about this, a user could always add a line item manually.

---

## Implementation: Where LLMs Fit

This project isn't all AI—most of the actual work is intentional engineering:

- **Gemini 3.1 Flash** → Core vision model: base64 image + structured prompt → JSON extraction
- **Claude Sonnet** → Rapid prompt iteration (tuning `_notes` instruction, line item rules)
- **Everything else** → Manual: API structure, frontend components, confidence flag logic, mismatch detection

The result: AI does what it's best at (vision), humans do the rest (UX, validation, persistence).

---

## Roadmap: Next Priorities

1. **Receipt image preview in the editor** — the user is reviewing extracted data but can't see the original image to verify. That's the most glaring gap in the current correction UX. Storing images in S3 or on disk and displaying them side-by-side would make corrections dramatically faster.
2. **Re-parse button** — if the extraction is badly wrong (blurry image), the user currently has to fix everything manually. A "try again" that re-sends to Gemini with a note ("the first extraction missed the date — it's on the bottom right") would save a lot of effort.
3. **Export** — CSV or JSON download of saved receipts. Obvious for expense tracking use cases.
4. **Better error recovery on malformed JSON** — currently if Gemini returns garbled output, the whole extraction fails. A fallback regex pass to rescue at least the total would be worth adding.

---

## The Real Insight

**Current limitation:** The spec emphasizes correction as the most important UX—and I agree. But there's a blind spot.

The way most apps handle AI output is wrong: they assume the LLM is ground truth and the user corrects *down from* it. That's backwards for low-quality images. Sometimes the model returns confident-looking *but incorrect* data, and the user has no signal to distrust it.

**The fix:** Show the original image alongside extracted fields. Not just flag uncertain ones—make verification immediate and visual. A user reviewing extracted data from memory is flying blind. A user reviewing it against the receipt photo will catch almost everything.

The current flag system is a mitigation. The real solution is the side-by-side view—that's the next priority.

---

## Contributing

This is a complete, self-contained application. Feel free to fork, extend, or use it as a foundation for your own receipt processing workflow.
