# Roast Analysis Feature — Design Spec

**Date:** 2026-03-15
**Status:** Approved

---

## Overview

Users paste code into the homepage editor, optionally toggle "roast mode" for sarcastic feedback, and submit. The app creates a submission record, fires off background AI analysis, and immediately redirects the user to a results page at `/roast/[analysisId]`. The results page polls until the analysis is complete, then displays the score, feedback, issues, and a suggested diff.

---

## Approach: Optimistic Redirect with Polling

Submit creates DB records synchronously and redirects immediately. AI processing happens in a background API route (fire-and-forget). The results page polls `analysis.getById` every 2 seconds until `status` reaches `"completed"` or `"failed"`.

This fits the existing `analysisStatus` enum (`pending | processing | completed | failed`) and gives the best perceived performance — users land on the results page instantly and see a loading state while AI works.

---

## Architecture

### New Files

| File | Purpose |
|---|---|
| `src/trpc/routers/analysis.ts` | `submit` mutation + `getById` query |
| `src/app/api/analyze/route.ts` | Background AI processing route |
| `src/app/roast/[id]/_components/roast-results-client.tsx` | Client component with polling |

### Modified Files

| File | Change |
|---|---|
| `src/trpc/routers/_app.ts` | Add `analysis: analysisRouter` |
| `src/app/_components/home-editor-client.tsx` | Wire `submit` mutation + `useRouter` redirect |
| `src/app/roast/[id]/page.tsx` | Replace mock data with real prefetch + render |

---

## Dependencies

- **`@mistralai/mistralai`** — official Mistral TypeScript SDK (new npm dependency)

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (existing) |
| `MISTRAL_API_KEY` | Mistral API key (new, set in `.env.local`) |
| `REVALIDATE_SECRET` | Secret for cache revalidation endpoint (existing) |
| `ANALYZE_SECRET` | Shared secret for the `/api/analyze` internal route (new) |
| `AI_MODEL_VERSION` | Model version string stored on analysis records (optional, defaults to `"unknown"`) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (e.g. `http://localhost:3000` in dev, production URL in prod). Required for constructing absolute URLs in server-side `fetch` calls. |

---

## AI Integration

**Model:** `mistral-small-latest`

**SDK usage:**
```ts
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const result = await mistral.chat.complete({
  model: "mistral-small-latest",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ],
});
```

`response_format: { type: "json_object" }` guarantees structured JSON output.

---

## tRPC Router: `analysis`

### `analysis.submit` (mutation)

**Input:**
```ts
{ code: string, analysisMode: "serious" | "roast" }
```

**Validation:**
- `code`: non-empty, max 1000 characters
- `analysisMode`: one of the enum values

**Server logic:**
1. Detect language from `code` using `highlight.js` `highlightAuto()`. Map the detected language name to the `programmingLanguage` enum; fall back to `"javascript"` if unrecognized.
2. Insert `submissions` row using `ctx.ipHash` and `ctx.userAgentHash` from context.
3. Insert `analyses` row with `status: "pending"`, `aiModelVersion: process.env.AI_MODEL_VERSION ?? "unknown"`.
4. Fire-and-forget: construct the absolute URL using `process.env.NEXT_PUBLIC_APP_URL` (e.g. `${process.env.NEXT_PUBLIC_APP_URL}/api/analyze`). POST with body `{ analysisId, submissionId }` and a shared secret header `x-analyze-secret: process.env.ANALYZE_SECRET`. No `await`, no error handling needed here.
5. Return `{ analysisId }`.

**Returns:** `{ analysisId: string }`

---

### `analysis.getById` (query)

**Input:** `{ id: string }` (UUID of the analysis record)

**Server logic:**
1. Join `analyses` with `submissions` on `analyses.submissionId = submissions.id`.
2. Return `null` if not found.
3. Parse `suggestions` (JSON string → array) and `diff` (JSON string → array) before returning.
4. Return `createdAt` as ISO string (`.toISOString()`), not a Date object (plain JSON only, no superjson).

**Returns:**
```ts
{
  status: "pending" | "processing" | "completed" | "failed",
  score: number | null,
  verdict: string | null,   // derived from score: see Verdict Mapping below
  feedback: string | null,
  suggestions: Array<{
    severity: "critical" | "warning" | "good",
    title: string,
    description: string
  }> | null,
  diff: Array<{
    type: "context" | "removed" | "added",
    content: string
  }> | null,
  language: string,
  code: string,
  analysisMode: "serious" | "roast",
  createdAt: string,
  errorMessage: string | null,
} | null
```

**Verdict Mapping** (derived from `score` in `getById`, not stored in DB):

| Score | Verdict |
|---|---|
| `null` | `null` |
| 0–2 | `"dumpster_fire"` |
| 3–4 | `"needs_serious_help"` |
| 5–6 | `"could_be_worse"` |
| 7–8 | `"decent_attempt"` |
| 9–10 | `"clean_code"` |

---

## API Route: `/api/analyze`

**File:** `src/app/api/analyze/route.ts`

**Method:** `POST`

**Body:** `{ analysisId: string, submissionId: string }`

**Auth:** The route checks for a shared secret header: `x-analyze-secret` must match `process.env.ANALYZE_SECRET`. Returns `401` if missing or mismatched. This prevents arbitrary external callers from triggering AI processing. The `submit` mutation sends this header when firing the request.

**Processing logic:**

1. Validate `x-analyze-secret` header.
2. Load submission from DB by `submissionId`.
3. Update `analyses.status` to `"processing"`.
4. Record `startTime = Date.now()`.
5. Read `analysisMode` from the loaded submission record and build the AI prompt (see Prompt Design below).
6. Call Mistral API with `mistral-small-latest` and `response_format: { type: "json_object" }`.
7. Parse and validate response shape: `score` must be an integer clamped to 0–10; `feedback` must be a non-empty string; `suggestions` must be an array of 2–4 items each with valid `severity`; `diff` must be an array. If validation fails, treat as an error (go to step 10).
8. Update `analyses` row:
   - `status: "completed"`
   - `score`, `feedback`, `suggestions` (serialized to JSON string), `diff` (serialized to JSON string)
   - `completedAt: new Date()`
   - `processingTimeMs: Date.now() - startTime`
9. Trigger leaderboard revalidation: fire-and-forget POST to `/api/revalidate/leaderboard` with `x-revalidate-secret` header.
10. On any error: update `analyses` row with `status: "failed"`, `errorMessage: error.message`.

---

## Prompt Design

### System Prompt

The system prompt instructs the model to act as a code reviewer and output a strict JSON object. Tone varies by `analysisMode`.

**Serious mode system prompt:**
```
You are a professional code reviewer. Analyze the provided code and return a JSON object with this exact shape:
{
  "score": <integer 0-10, where 0 is terrible and 10 is perfect>,
  "feedback": "<one concise sentence summarizing the overall code quality>",
  "suggestions": [
    { "severity": "critical" | "warning" | "good", "title": "<short title>", "description": "<explanation>" }
  ],
  "diff": [
    { "type": "context" | "removed" | "added", "content": "<line content without prefix>" }
  ]
}
Return 2-4 suggestions. The diff should show only the single most impactful improvement, with a few context lines for clarity. Return only the JSON object, no other text.
```

**Roast mode system prompt:** Same structure but with a sarcastic, comedic tone. The `feedback` field should be a burn/joke. Suggestions can be sardonic but must still be technically accurate.

### User Prompt

```
Language: {language}
Code:
{code}
```

---

## Homepage Editor Changes

`src/app/_components/home-editor-client.tsx`:

1. Add `roastMode` state (`boolean`, default `false`). Wire to the existing `Toggle` component's `checked` + `onCheckedChange`.
2. Add `useTRPC()` + `useMutation(trpc.analysis.submit.mutationOptions(...))`.
3. On button click: call `mutate({ code, analysisMode: roastMode ? "roast" : "serious" })`.
4. On mutation success: `router.push(\`/roast/\${data.analysisId}\`)`.
5. Button disabled when: `code.length === 0 || code.length > MAX_SNIPPET || isPending`.
6. Button text changes to `"$ analyzing..."` while `isPending`.

---

## Results Page

### Server Component: `src/app/roast/[id]/page.tsx`

1. Await `params` to get `id`.
2. Call `prefetch(trpc.analysis.getById.queryOptions({ id }))` for server-side hydration.
3. Wrap output in `<HydrateClient>`.
4. Render `<RoastResultsClient id={id} />`.

### Client Component: `src/app/roast/[id]/_components/roast-results-client.tsx`

1. `useQuery(trpc.analysis.getById.queryOptions({ id }, { refetchInterval: ... }))`.
2. `refetchInterval`: callback receives `query` — if `query.state.data` is null or has status `"pending"` or `"processing"`, return `2000`; otherwise return `false`. Guard against null data before accessing `.status`.
3. **Loading state** (`pending` / `processing` / initial undefined): Show skeleton placeholders matching the layout sections (score ring, text lines, issue cards, diff block).
4. **Completed state**: Render the full results UI (moved from current `page.tsx` mock, real data substituted). `ScoreRing` receives `score ?? 0` — a null score after completion is treated as 0.
5. **Failed state**: Show an error message with `errorMessage` text if present.
6. **Null state**: Show an "analysis not found" message.

The existing results UI (score hero, submission code block, issues grid, diff block) moves from `page.tsx` into this client component with mock data replaced by real data. The `share_roast` button is removed.

---

## Data Flow Summary

```
User clicks submit
  → analysis.submit mutation
    → DB: insert submissions + analyses (status: pending)
    → fire-and-forget: POST /api/analyze
    → return { analysisId }
  → router.push(/roast/[analysisId])

Results page loads
  → server prefetch: analysis.getById (status: pending)
  → RoastResultsClient renders skeleton
  → polls every 2s

/api/analyze (background)
  → DB: update status → "processing"
  → call Mistral API (mistral-small-latest)
  → DB: update with results (status: "completed")
  → fire-and-forget: POST /api/revalidate/leaderboard

Client poll detects status: "completed"
  → stops polling
  → renders full results UI
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| Mistral API call fails | `/api/analyze` catches error, sets `status: "failed"`, `errorMessage` |
| AI returns malformed/invalid JSON | Caught in `/api/analyze` validation step, sets `status: "failed"` |
| AI returns out-of-range score | Score clamped to 0–10 before storing |
| Results page shows failed analysis | Client renders error state with `errorMessage` |
| `analysis.getById` returns `null` | Client renders "analysis not found" message |
| Submit mutation fails (DB error) | tRPC returns error; client shows inline error near submit button |
| Rate limit exceeded | `analysis.submit` throws a tRPC `TOO_MANY_REQUESTS` error; client shows inline message near submit button |
| `suggestions` / `diff` JSON parse fails | `getById` returns `null` for those fields; UI omits those sections gracefully |
| `/api/analyze` called with wrong/missing secret | Returns `401`, analysis never transitions out of `"pending"` |

---

## Out of Scope

- Share roast button / social sharing
- User accounts / authentication
- Streaming AI responses

---

## Rate Limiting

**Strategy:** Database-based, counted per `ipHash`, using the existing `submissions` table.

**Limit:** 10 submissions per IP per hour.

**Implementation:** At the start of `analysis.submit`, before any DB writes, query the `submissions` table:

```ts
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentCount = await ctx.db
  .select({ count: count() })
  .from(submissions)
  .where(and(eq(submissions.ipHash, ctx.ipHash), gte(submissions.createdAt, oneHourAgo)));

if ((recentCount[0]?.count ?? 0) >= 10) {
  throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded. Try again later." });
}
```

**Client behavior:** When the mutation returns a `TOO_MANY_REQUESTS` error, display an inline error message below the submit button (e.g. `"// rate limit exceeded. try again later."`). Button remains enabled so the user can retry after the window expires.
