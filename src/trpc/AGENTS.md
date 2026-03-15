# tRPC Guidelines

## Overview

This directory contains the tRPC v11 setup for DevRoast, integrating with TanStack React Query for server-prefetch and client-hydration data fetching. The setup uses the `@trpc/tanstack-react-query` package (the TanStack-native tRPC integration, not the older `@trpc/react-query`).

## Directory Structure

```
src/trpc/
├── AGENTS.md          # This file
├── init.ts            # tRPC initialization (context, router factory, base procedure)
├── client.tsx         # Client-side provider and hooks ("use client")
├── server.tsx         # Server-side helpers (prefetch, HydrateClient, caller)
├── query-client.ts    # Shared QueryClient factory
└── routers/
    ├── _app.ts        # Root router (merges all sub-routers)
    └── leaderboard.ts # Leaderboard queries
```

## Architecture

### Data Flow

```
Server Component (prefetch)
  └── trpc.router.procedure.queryOptions()
        └── Calls appRouter procedure DIRECTLY (no HTTP)
              └── Procedure accesses ctx.db (Drizzle)
                    └── Result stored in server-side QueryClient

  └── <HydrateClient>  (dehydrates QueryClient into RSC payload)
        └── Client Component
              └── useQuery(trpc.router.procedure.queryOptions())
                    └── Reads from hydrated cache (zero network requests)
                    └── After staleTime (30s), refetches via httpBatchLink -> /api/trpc
```

### Key Files

#### `init.ts` - tRPC Initialization

- **Context factory** (`createTRPCContext`): Wrapped in React's `cache()` for per-request deduplication. Provides:
  - `db` - Drizzle client singleton from `@/db/client`
  - `ipHash` - SHA-256 hash of `x-forwarded-for` header (anonymous tracking)
  - `userAgentHash` - SHA-256 hash of `user-agent` header
- **Exports**: `createTRPCContext`, `createTRPCRouter`, `createCallerFactory`, `baseProcedure`
- **No transformer** configured (plain JSON, no superjson)
- **No middleware** defined yet (no auth, no rate limiting)
- Uses `node:crypto` for hashing, `next/headers` for header access

#### `client.tsx` - Client Provider

- Marked `"use client"` - this is a React Client Component
- **`TRPCReactProvider`**: Wraps the app with `QueryClientProvider` and `TRPCProvider`
- **`useTRPC`**: Hook for client components to access the tRPC client
- **Browser singleton**: `QueryClient` is created once on the client (module-level variable), new instance per request on the server
- **Transport**: `httpBatchLink` (batches multiple tRPC calls into a single HTTP request)
- **URL resolution**: Empty string (browser, same origin), `VERCEL_URL` (Vercel), `localhost:3000` (fallback)
- **tRPC client**: Created inside `useState(() => ...)` for lazy initialization without re-creation on re-renders

#### `server.tsx` - Server Helpers

- **`import "server-only"`**: Build-time enforcement that this module never runs on the client
- **`trpc`**: Server-side proxy created via `createTRPCOptionsProxy` -- calls procedures directly with no HTTP round-trip
- **`prefetch()`**: Populates the server-side `QueryClient` with query results. Handles both regular and infinite queries.
- **`HydrateClient`**: Dehydrates the server `QueryClient` state and transfers it to the client via `HydrationBoundary`
- **`caller`**: Direct server-only procedure caller (for server actions or API routes that don't need client cache sharing)
- **`getQueryClient`**: Wrapped in `cache()` for per-request deduplication

#### `query-client.ts` - QueryClient Factory

- **`makeQueryClient()`**: Shared factory used by both server and client
- **`staleTime: 10 * 60 * 1000`** (10 minutes): Queries are fresh for 10 minutes
- **Note**: This is a fallback for client-side caching. Prefer Next.js 16 Cache Components for server-side caching (see root AGENTS.md)
- **Custom dehydration**: Also dehydrates queries with `status === "pending"` (critical for server prefetch where queries may still be pending during render)

## Router Patterns

### Root Router (`routers/_app.ts`)

```tsx
import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
```

- Single root router merges all sub-routers
- `AppRouter` type is exported for the client-side type-safe proxy
- Sub-routers are imported and nested by name

### Defining Procedures (`routers/leaderboard.ts`)

```tsx
import { createTRPCRouter, baseProcedure } from "../init";

export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    // Access Drizzle via ctx.db
    const [countResult, avgResult] = await Promise.all([
      ctx.db.select({ count: count() }).from(submissions),
      ctx.db.select({ avg: avg(analyses.score) }).from(analyses).where(eq(analyses.status, "completed")),
    ]);
    return {
      totalSubmissions: countResult[0]?.count ?? 0,
      avgScore: avgResult[0]?.avg ? Number(avgResult[0].avg) : null,
    };
  }),
});
```

Key patterns:
- Use `baseProcedure` as the starting point for all procedures
- Access the database through `ctx.db` (the Drizzle client from context)
- Use `Promise.all()` for parallel database queries
- Input validation uses Zod (when needed): `baseProcedure.input(z.object({...})).query(...)`
- PostgreSQL `avg()` returns a string -- parse with `Number()`
- Use nullish coalescing (`?? 0`, `?? null`) for safe defaults

### Adding a New Router

1. Create a new file in `routers/` (e.g., `routers/submissions.ts`)
2. Define the router using `createTRPCRouter` and `baseProcedure`
3. Import schema tables from `@/db/schema`
4. Import Drizzle operators from `drizzle-orm` (`eq`, `desc`, `count`, `avg`, etc.)
5. Register the router in `routers/_app.ts`

### Adding a New Procedure

1. Add to an existing router using `baseProcedure.query()` or `baseProcedure.mutation()`
2. For input validation: `baseProcedure.input(z.object({ ... })).query()`
3. Access context via `{ ctx }` -- includes `ctx.db`, `ctx.ipHash`, `ctx.userAgentHash`
4. Return plain objects (no superjson, so no Date objects -- use ISO strings if needed)

## Client-Side Usage

### In Client Components

```tsx
"use client";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";

function MyComponent() {
  const trpc = useTRPC();

  // Queries
  const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

  // Mutations
  const mutation = useMutation(trpc.submissions.create.mutationOptions());
}
```

### Server-Side Prefetch

```tsx
// Server component
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export default async function Page() {
  prefetch(trpc.leaderboard.stats.queryOptions());

  return (
    <HydrateClient>
      <ClientComponent />
    </HydrateClient>
  );
}
```

## Import Conventions

- **Server files**: Import from `@/trpc/server` (`trpc`, `prefetch`, `HydrateClient`, `caller`)
- **Client components**: Import from `@/trpc/client` (`useTRPC`, `TRPCReactProvider`)
- **Router files**: Use relative imports within `routers/` and `../init` for tRPC utilities
- **Schema imports**: Use `@/db/schema` for table definitions
- **Drizzle operators**: Import from `drizzle-orm` (`eq`, `desc`, `count`, `avg`, `and`, `or`, etc.)
