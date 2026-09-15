# Split Fatoora

Split the bill, not the friendship. Upload a receipt, check the lines, say who had what, and
see exactly what each person owes — charges included.

## Running it

Receipt scanning calls Gemini Vision, so the server needs a Gemini API key. Put these
values in `.env` (git-ignored); they are only ever read server-side:

```dotenv
GEMINI_API_KEY=your-gemini-api-key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-3.5-flash-lite
OCR_PROVIDER=gemini
```

```bash
npm install
npm run dev        # dev server; /api/extract is mounted on it
npm run build      # typecheck + production build
npm start          # production: serves dist/ + /api/extract
npm run test       # calculation and state tests (no API calls, no cost)
npm run lint
```

Without a key the app still works — everything except scanning. Use
"Enter a receipt manually" and the scan button will report the failure clearly.

## The flow

Five screens, one obvious action on each:

| Route      | Screen         | What happens                                              |
| ---------- | -------------- | --------------------------------------------------------- |
| `/`        | Home           | Load a receipt (sample data) or start one by hand          |
| `/review`  | Receipt Review | Edit item names, prices, VAT, service and other charges    |
| `/people`  | People         | Add everyone who is splitting                              |
| `/assign`  | Item Assignment| Tap names against items; shared items divide evenly        |
| `/results` | Results        | Per-person breakdown plus a reconciliation against the receipt |

Steps after Home are guarded by `RequireReceipt`, so a deep link without a loaded receipt
returns to Home. Each step's primary button stays disabled until that step validates.

## How the split works

`src/lib/calculateSplit.ts` is pure — no React, no state, no side effects:

- Each item is divided evenly between the people assigned to it.
- VAT, service and other charges are spread **in proportion to** what each person ordered,
  so a bigger order carries more of the charges.
- All arithmetic runs in integer cents and shares out remainders with the largest-remainder
  method (`allocateCents`), so the shares always sum back to the total exactly — no lost piastre.
- Items nobody is assigned to are surfaced as `unassignedSubtotal` rather than quietly dropped.

## Reading receipts

The photo goes to `POST /api/extract`, which reads it with Gemini Vision
(`gemini-3.5-flash-lite`, vision + JSON output) and returns a `Receipt`. **The API token
lives only on the server** — the browser never sees it.

Extraction transcribes; it does not reconcile. The prompt tells the model to report the
printed figures even when the receipt's own arithmetic doesn't tie up, and Receipt
Review is where the user sees and fixes any disagreement. Item ids are minted
server-side, never by the model.

Failures surface as a screen with the reason plus **Try again** (the image is kept, so
there's no need to re-pick it) and **Pick another photo**.

```
server/
  api.ts               POST /api/extract — framework-free handler
  receiptSchema.ts     Zod schema + system prompt (the extraction contract)
  devApiPlugin.ts      mounts the handler on the Vite dev server
  index.ts             production server: dist/ + the endpoint, zero deps
  ocr/
    provider.ts        the OcrProvider interface — the swap seam
    claude.ts          Claude vision implementation
    index.ts           provider registry, selected by OCR_PROVIDER
    validate.ts        turns untrusted provider output into a Receipt
```

### Swapping provider

Everything above `ocr/` talks only to the `OcrProvider` interface: give it an image,
get back a `RawReceipt` whose every field is `unknown`. To move to another service,
add a module implementing that interface and register it in `ocr/index.ts` — the
endpoint, the validator and the app are untouched. Pick one at runtime with
`OCR_PROVIDER=<name>`; an unregistered name fails at the request with a clear 500
rather than silently falling back.

### Two rules the validator enforces

`ocr/validate.ts` sits between the provider and the app, and it is the reason OCR
output is never trusted:

- **Nothing is trusted.** Every field is re-checked and coerced. Strings become
  numbers where they can (`"1,234.50"` → `1234.5`), `NaN`/`Infinity`/`null`/wrong
  types become 0, amounts round to whole cents, and implausible figures are dropped.
  A provider returning garbage cannot produce a receipt the UI must defend against.
- **Nothing is computed.** A missing subtotal stays 0 rather than being summed from
  the items. Deriving it here would launder a guess into something indistinguishable
  from a figure actually read off the paper. All bill maths belongs to
  `src/lib/calculateSplit.ts`, which ignores the receipt's own `subtotal` and `total`
  entirely — there is a test asserting that corrupting them changes no share.

### Incomplete reads are not failures

A thin or partial read returns **200** with `extraction.warnings` and
`complete: false`. The user lands on Receipt Review as usual, with a "check these"
notice naming what couldn't be read, and edits from there — every field is editable
regardless of how it arrived. Only a failure to read *at all* (no network, rejected
key, refusal) shows the failure screen, and even that offers **Enter it by hand**, so
extraction can never dead-end.

### Testing extraction (costs money)

`npm run test` never calls the API — the validator's behaviour (junk input, partial
reads, rounding, the no-computation rule) is covered by free unit tests in
`server/ocr/validate.test.ts`. To exercise the real provider against a synthetic
receipt with known figures:

```bash
node server/makeTestReceipt.mjs test-receipt.png   # free
npm start &                                        # needs ANTHROPIC_AUTH_TOKEN
node server/smokeExtract.mjs                       # one API call
```

It asserts the awkward cases: a `2 x` line keeps the printed line total rather than the
unit price, a municipality tax stays separate from VAT, delivery lands in other charges,
and the items sum to the printed subtotal.

## Layout

```
src/
  screens/      one file per route
  components/   ui/ primitives + a folder per screen, each with a CSS module
  lib/          calculateSplit, money, validation — all pure
  state/        useReducer session (receipt, people, assignments) behind a context
  data/         extractReceipt (calls the endpoint); mock receipt for tests
  types/        Receipt, Person, Assignments, SplitResult
```

## Not built yet

By design: no auth, payments, database or chat.
