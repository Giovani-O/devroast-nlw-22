# Pages & Routes Guidelines

## Overview

This directory contains the Next.js App Router pages, layouts, and API routes. All pages follow the design system and styling guidelines defined in the project.

## Directory Structure

```
src/app/
├── AGENTS.md                    # This file
├── layout.tsx                   # Root layout (navbar, providers, content wrapper)
├── page.tsx                     # Homepage (server component)
├── globals.css                  # Global styles, theme variables, Shiki overrides
├── favicon.ico                  # Site favicon
├── _components/                 # Private directory for homepage components
│   ├── page.tsx                 # Component preview gallery (hidden route)
│   ├── home-editor-client.tsx   # Client: code editor + actions bar
│   ├── home-stats-client.tsx    # Client: animated stats display
│   └── home-stats.tsx           # Server: prefetch wrapper for stats
├── leaderboard/
│   └── page.tsx                 # Leaderboard page (server component)
├── roast/
│   └── [id]/
│       ├── layout.tsx           # Nested layout (adds padding)
│       └── page.tsx             # Roast results page (server, dynamic route)
└── api/
    └── trpc/
        └── [trpc]/
            └── route.ts         # tRPC HTTP handler (GET + POST)
```

## Layout Architecture

```
<html>
  <body>  (font CSS variables, bg-bg-page, text-text-primary)
    <TRPCReactProvider>
      <Navbar />                   (persistent, server component)
      <main>                       (centered, paddingTop: 80px, sides: 40px)
        <div max-w-[960px]>        (content constraint)
          {children}               (page content)
        </div>
      </main>
    </TRPCReactProvider>
  </body>
</html>
```

### Root Layout (`layout.tsx`)

The root layout is a **server component** that provides:
- **Font setup** via `next/font/google`: JetBrains Mono (`--font-mono`), IBM Plex Mono (`--font-secondary`)
- **tRPC provider** wrapping all content (`<TRPCReactProvider>`)
- **Persistent navbar** rendered on every page
- **Content centering** with `max-w-[960px]`, flex column, `items-center`
- **Global body styles** via Tailwind: `antialiased bg-bg-page text-text-primary`
- **Static metadata** export: title and description

### Nested Layouts

Route groups can add their own layout. Example: `roast/[id]/layout.tsx` adds horizontal padding (`0 40px`) for its segment without affecting the root layout.

Nested layouts should:
- Be server components (no `"use client"`)
- Only add incremental styling/wrapping
- Accept typed children: `Readonly<{ children: React.ReactNode }>`

## Page Patterns

### Server Components (Default)

Pages are server components by default. Use for:
- Static content and markup
- Data prefetching via tRPC
- Composing client components as children
- Async operations (pages can be `async function`)

```tsx
// Async server page
export default async function LeaderboardPage() {
  // Can await data, access DB, etc.
  return <div>...</div>;
}
```

### Client Components

Add `"use client"` only when the component needs hooks, state, or browser APIs. Place client components in `_components/` and import them from server pages.

### Dynamic Routes (Next.js 16)

In Next.js 16, `params` is a Promise and must be awaited:

```tsx
export default async function RoastPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Use id for data fetching
}
```

## Private Directory Pattern (`_components/`)

The underscore prefix (`_components/`) prevents Next.js from treating the directory as a route. Use this for:
- Page-specific components that don't belong in shared `src/components/`
- Co-locating server and client components for a specific page
- Component preview/gallery pages (hidden by the underscore)

Import with relative paths from sibling pages:

```tsx
import { HomeEditorClient } from "./_components/home-editor-client";
```

## Data Fetching Pattern

### Server-Prefetch + Client-Hydration

This is the primary pattern for pages that need real data:

```tsx
// 1. Server component prefetches data
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export async function HomeStats() {
  prefetch(trpc.leaderboard.stats.queryOptions());
  return (
    <HydrateClient>
      <HomeStatsClient />
    </HydrateClient>
  );
}

// 2. Client component reads from hydrated cache
"use client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export function HomeStatsClient() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.leaderboard.stats.queryOptions());
  // Data available immediately -- no loading spinner
}
```

### Server-Side Caching with "use cache"

For pages with data that changes infrequently, use Next.js 16 Cache Components instead of TanStack Query hydration. See the root AGENTS.md for full documentation.

```tsx
// src/lib/leaderboard-cache.ts
import { cacheTag, cacheLife } from "next/cache";
import { db } from "@/db/client";

export async function getLeaderboardStats() {
  "use cache";
  cacheTag("leaderboard-stats");
  cacheLife({ stale: 600, revalidate: 600, expire: 600 }); // 10 minutes

  return db.select().from(analyses).where(eq(analyses.status, "completed"));
}

// src/app/leaderboard/page.tsx
import { getLeaderboardStats } from "@/lib/leaderboard-cache";

export default async function LeaderboardPage() {
  const stats = await getLeaderboardStats();
  // ... render
}
```

### Error Boundaries

Wrap client components that fetch data in `<ErrorBoundary>` from `react-error-boundary`:

```tsx
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary fallback={<StaticFallback />}>
  <DataFetchingClient />
</ErrorBoundary>
```

The fallback should render a static placeholder with dashes replacing dynamic values (e.g., `"-- codes roasted"` instead of `"42 codes roasted"`).

## API Routes

### tRPC Handler

The tRPC API route at `api/trpc/[trpc]/route.ts` uses the fetch adapter:

```tsx
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

Both `GET` (queries) and `POST` (mutations) export the same handler.

## Styling Guidelines

### Colors

Use theme variables from `globals.css`:
- **Backgrounds**: `bg-bg-page`, `bg-bg-surface`, `bg-bg-elevated`, `bg-bg-input`
- **Text**: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- **Accents**: `text-accent-green`, `text-accent-amber`, `text-accent-red`, `text-accent-blue`, `text-accent-orange`
- **Borders**: `border-border-primary`, `border-border-secondary`, `border-border-focus`

### Typography

- **JetBrains Mono** (`font-mono`): Code, titles, labels, buttons, section headers
- **IBM Plex Mono** (`font-secondary`): Subtitles, descriptions, stats, secondary text
- Font weights: `font-normal` (400), `font-medium` (500), `font-bold` (700)
- Use `tabular-nums` for numeric displays (scores, counters)
- Use inline `style={{ fontSize: "Xpx" }}` for exact pixel sizes

### Width Constraints

- **960px** (`max-w-[960px]`): Root layout wrapper, leaderboard sections
- **780px** (`max-w-[780px]`): Code editor, actions bar, hero sections

### Spacing

- Use `gap-8` (32px) between major sections
- Use inline `style={{ gap: "Xpx" }}` for precise gap values
- Use `<div style={{ height: "60px" }} />` for explicit spacers
- Center sections with `mx-auto` or parent `flex-col items-center`

## Recurring UI Patterns

### Section Title with Accent Prefix

```tsx
<div className="flex items-center gap-3">
  <span className="font-mono font-bold text-accent-green" style={{ fontSize: "36px" }}>
    $
  </span>
  <span className="font-mono font-bold text-text-primary" style={{ fontSize: "36px" }}>
    paste your code. get roasted.
  </span>
</div>
```

The accent prefix character varies by page: `$` (homepage), `>` (leaderboard), `//` (section titles).

### Subtitle with Comment Syntax

```tsx
<p className="font-secondary text-text-secondary text-center" style={{ fontSize: "14px" }}>
  {"// the worst code on the internet, ranked by how bad it is"}
</p>
```

### Stat Row with Dot Separators

```tsx
<div className="flex items-center gap-2 font-secondary text-text-tertiary" style={{ fontSize: "12px" }}>
  <span>42 codes roasted</span>
  <span>·</span>
  <span>avg score: 4.2/10</span>
</div>
```

### Divider

```tsx
<div className="w-full h-px bg-border-primary" />
```

### Flex Table Layout

Tables use div-based flex layout with fixed-width columns:

```tsx
<div className="flex items-start" style={{ fontSize: "12px", padding: "16px 20px" }}>
  <span className="font-mono flex-shrink-0" style={{ width: "50px" }}>{rank}</span>
  <span className="font-mono flex-shrink-0" style={{ width: "70px" }}>{score}</span>
  <div className="flex-1">{content}</div>
  <span className="font-mono flex-shrink-0" style={{ width: "100px" }}>{language}</span>
</div>
```

### HTML Entity Escaping

```tsx
// Incorrect - unescaped quotes
<span>eval(prompt("enter code"))</span>

// Correct - template literal
<span>{`eval(prompt("enter code"))`}</span>

// Correct - curly braces for static strings
<span>{"// the worst code on the internet"}</span>

// HTML entities for symbols
<a href="/leaderboard">view full leaderboard &gt;&gt;</a>
```

## Design System Components

Use UI components from `@/components/ui/`:

- **Button**: Actions and CTAs. Variants: `default`, `secondary`, `ghost`, `outline`, `destructive`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. Rounded: `none`, `sm`, `default`, `lg`, `full`.
- **Toggle**: Boolean switches (Radix-based, requires client component).
- **Card**: Grouped content. Variants: `default`, `elevated`, `ghost`.
- **Badge**: Status indicators. Variants: `critical`, `warning`, `good`, `verdict`.
- **CodeBlock**: Syntax-highlighted code display (async server component, uses Shiki).
- **CodeEditor**: Editable code input with live highlighting (client component).
- **ScoreRing**: SVG circular progress indicator (client component).
- **DiffLine**: Code diff line display. Variants: `removed`, `added`, `context`.
- **Table**: Div-based table structure with Header, Body, Row, Cell sub-components.

## Development Workflow

1. **Check Pencil selection** - Use `pencil_get_editor_state` to see current selection
2. **Ask for confirmation** - If a page/component is selected, confirm it should be followed
3. **Extract design details** - Use `pencil_batch_get` for exact measurements and colors
4. **Implement faithfully** - Match all styling details from Pencil
5. **Test and verify** - Run `npm run biome` and `npx tsc --noEmit`

## Quality Checklist

- [ ] All colors use theme variables (no hardcoded hex when a variable exists)
- [ ] Font families and sizes match the design
- [ ] Spacing and padding are accurate
- [ ] TypeScript types are correct (`npx tsc --noEmit`)
- [ ] Biome linting passes (`npm run biome`)
- [ ] No console errors in dev server
