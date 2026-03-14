# tRPC Implementation — Specification

## Project Context

- **Project**: DevRoast — Code Analysis Platform
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **tRPC version**: v11 (`@trpc/tanstack-react-query` integration)
- **Current State**: No API layer. DB schema + Drizzle client exist (`src/db/`). Utility query functions exist (`src/lib/db-utils.ts`). All data is still static mock.
- **Target files**:
  - `src/trpc/init.ts` — tRPC initializer + context
  - `src/trpc/query-client.ts` — shared `QueryClient` factory
  - `src/trpc/routers/_app.ts` — root router
  - `src/trpc/routers/submissions.ts` — submissions router
  - `src/trpc/routers/leaderboard.ts` — leaderboard router
  - `src/trpc/client.tsx` — client-side provider + `useTRPC` hook (marks `'use client'`)
  - `src/trpc/server.ts` — server-side caller + `HydrateClient` + `prefetch` helpers (marks `server-only`)
  - `src/app/api/trpc/[trpc]/route.ts` — HTTP handler (fetch adapter)
  - `src/app/layout.tsx` — mount `TRPCReactProvider`

---

## Overview

Introduce tRPC v11 with the TanStack React Query integration as the sole API layer for DevRoast. Server Components call procedures directly via a server-side proxy (no HTTP round-trip). Client Components call procedures via `useTRPC()` + TanStack Query hooks, with data prefetched and dehydrated from the server. This replaces ad-hoc server action stubs and the future direct-DB calls in pages.

---

## Decisions

| Question | Decision | Rejected alternatives |
|---|---|---|
| tRPC integration style | `@trpc/tanstack-react-query` v11 (new TanStack-native API) | Classic `@trpc/react-query` v10 — older API, not future-proof |
| Server component data access | `createTRPCOptionsProxy` on server + `prefetch`/`HydrateClient` helpers | Direct Drizzle calls in pages — bypasses tRPC contract entirely |
| HTTP transport | `httpBatchLink` (batches multiple calls in one request) | `httpLink` — no batching; `splitLink` — premature complexity |
| Data transformer | None for now (plain JSON is sufficient) | `superjson` — adds complexity; needed only when passing `Date`/`Map`/`Set` over the wire |
| Context | Request-scoped: extracts `ip` from headers, passes `db` instance | Per-user auth context — no auth in v1 |
| Mutations | tRPC mutations via `useMutation` from TanStack Query | Next.js Server Actions — tRPC gives us a unified, type-safe contract across the board |
| Router location | `src/trpc/` (sibling to `src/app/`, `src/db/`) | `src/app/trpc/` — mixing routing config with app routes is confusing |

---

## Architecture

### Directory structure

```
src/
├── trpc/
│   ├── init.ts              # initTRPC, createTRPCContext, base procedure exports
│   ├── query-client.ts      # makeQueryClient() factory (shared server/client)
│   ├── client.tsx           # 'use client' — TRPCReactProvider, useTRPC
│   ├── server.ts            # server-only — trpc proxy, getQueryClient, HydrateClient, prefetch
│   └── routers/
│       ├── _app.ts          # appRouter (merges sub-routers), exports AppRouter type
│       ├── submissions.ts   # createSubmission mutation, getSubmission query
│       └── leaderboard.ts   # getLeaderboard query
├── app/
│   ├── layout.tsx           # wrap children in <TRPCReactProvider>
│   └── api/
│       └── trpc/
│           └── [trpc]/
│               └── route.ts # GET + POST fetch adapter handler
```

### Data flow

```
Server Component (page.tsx)
  └─ imports { trpc, prefetch, HydrateClient } from '@/trpc/server'
       └─ prefetch(trpc.submissions.get.queryOptions({ id }))
           └─ createTRPCOptionsProxy calls router procedure directly (no HTTP)
               └─ procedure calls db via Drizzle
  └─ renders <HydrateClient> (dehydrates QueryClient into RSC payload)
       └─ renders <ClientComponent />
            └─ useTRPC() → useQuery(trpc.submissions.get.queryOptions({ id }))
                └─ reads from hydrated cache (no extra network request)

Client Component mutation flow
  useTRPC() → useMutation(trpc.submissions.create.mutationOptions())
    └─ POST /api/trpc/submissions.create (httpBatchLink)
        └─ route.ts handler → fetchRequestHandler → router procedure → Drizzle
```

### Key interfaces / types

```typescript
// Context available in every procedure
interface TRPCContext {
  db: typeof db;           // Drizzle client
  ipHash: string;          // SHA-256 hash of x-forwarded-for header
  userAgentHash: string;   // SHA-256 hash of user-agent header
}

// submissions router I/O
submissions.create input:  { code: string; language: ProgrammingLanguage; analysisMode: 'serious' | 'roast' }
submissions.create output: { id: string }   // UUID of the new submission

submissions.get input:     { id: string }
submissions.get output:    Submission & { analysis: Analysis | null }

// leaderboard router I/O
leaderboard.get input:     { limit?: number }   // default 10
leaderboard.get output:    Array<LeaderboardEntry>
```

### Context creation

```typescript
// src/trpc/init.ts
import { cache } from 'react';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/db/client';

export const createTRPCContext = cache(async () => {
  const h = await headers();
  const ip = h.get('x-forwarded-for') ?? 'unknown';
  const ua = h.get('user-agent') ?? '';
  return {
    db,
    ipHash: crypto.createHash('sha256').update(ip).digest('hex'),
    userAgentHash: crypto.createHash('sha256').update(ua).digest('hex'),
  };
});
```

> `cache()` from React deduplicates the context call within a single request so `headers()` is only called once per request even if multiple procedures run.

### Server helpers (`src/trpc/server.ts`)

```typescript
import 'server-only';
import { cache } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createTRPCOptionsProxy, type TRPCQueryOptions } from '@trpc/tanstack-react-query';
import { makeQueryClient } from './query-client';
import { createTRPCContext } from './init';
import { appRouter } from './routers/_app';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const qc = getQueryClient();
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void qc.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void qc.prefetchQuery(queryOptions);
  }
}

// For server-only data reads (not shared with client cache)
export const caller = appRouter.createCaller(createTRPCContext);
```

---

## Implementation Plan

### Phase 1 — Scaffold tRPC infrastructure

- [ ] Install dependencies: `npm install @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod client-only server-only`
- [ ] Create `src/trpc/init.ts` — `initTRPC`, `createTRPCContext`, `baseProcedure`, `createTRPCRouter`, `createCallerFactory`
- [ ] Create `src/trpc/query-client.ts` — `makeQueryClient()` with `staleTime: 30s` and dehydrate pending queries
- [ ] Create `src/trpc/client.tsx` (`'use client'`) — `TRPCReactProvider`, exports `useTRPC`
- [ ] Create `src/trpc/server.ts` (`server-only`) — `trpc` proxy, `getQueryClient`, `HydrateClient`, `prefetch`, `caller`
- [ ] Create `src/app/api/trpc/[trpc]/route.ts` — `fetchRequestHandler` for GET + POST
- [ ] Wrap root layout (`src/app/layout.tsx`) children in `<TRPCReactProvider>`

### Phase 2 — Submissions router

- [ ] Create `src/trpc/routers/submissions.ts`
  - `create` mutation: validates input with Zod, inserts into `submissions` table, inserts stub `analyses` record with `status: 'pending'`, returns `{ id }`
  - `get` query: fetches submission + joined analysis by submission UUID, returns combined record
- [ ] Create `src/trpc/routers/_app.ts` — merges `submissions` and `leaderboard` routers, exports `AppRouter` type

### Phase 3 — Leaderboard router

- [ ] Create `src/trpc/routers/leaderboard.ts`
  - `get` query: wraps `getLeaderboard()` from `src/lib/db-utils.ts`, accepts optional `limit` (max 50)

### Phase 4 — Wire up homepage submission

- [ ] Convert the `$ roast_my_code` button in `src/app/page.tsx` to call `trpc.submissions.create` mutation via `useMutation`
- [ ] On mutation success, `router.push('/roast/' + data.id)` using Next.js `useRouter`
- [ ] Show loading state on button while mutation is pending
- [ ] Show error state (inline message) if mutation fails

### Phase 5 — Wire up Roast Results page

- [ ] In `src/app/roast/[id]/page.tsx`, replace static mock data:
  - `prefetch(trpc.submissions.get.queryOptions({ id }))` in the server component
  - Wrap with `<HydrateClient>`
  - Extract the client display into `src/app/roast/[id]/results-client.tsx` (`'use client'`)
  - `useSuspenseQuery(trpc.submissions.get.queryOptions({ id }))` in the client component
  - Wrap with `<Suspense>` + `<ErrorBoundary>` in the server component

### Phase 6 — Verify and clean up

- [ ] Run `npx tsc --noEmit` — fix any type errors
- [ ] Run `npm run biome` — fix any lint issues
- [ ] Confirm `/api/trpc/submissions.create` and `/api/trpc/submissions.get` return correct responses in dev
- [ ] Remove `src/lib/db-utils.ts` functions that are now fully superseded by tRPC procedures (or keep as internal helpers called by procedures)

---

## References

- tRPC v11 Setup: https://trpc.io/docs/client/tanstack-react-query/setup
- tRPC + RSC guide: https://trpc.io/docs/client/tanstack-react-query/server-components
- TanStack Query Advanced SSR: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- Drizzle schema: `src/db/schema.ts`
- Drizzle client: `src/db/client.ts`
- DB utility helpers: `src/lib/db-utils.ts`
- Drizzle implementation spec: `specs/DRIZZLE_IMPLEMENTATION_SPEC.md`
