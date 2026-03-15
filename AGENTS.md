# Project Guidelines for Agents

## Overview

DevRoast is a code roasting web app where users paste code snippets and receive AI-generated feedback/roasts. This file documents conventions that AI agents should follow when working on this project.

## AGENTS.md Files

AGENTS.md files should **document patterns**, not direct file references. They serve as guidelines for how to work with specific parts of the project.

### Naming

All agent guidelines files should be named in **UPPERCASE**: `AGENTS.md`

### Structure

- Root-level AGENTS.md: Documents project-wide patterns
- Directory-level AGENTS.md: Documents patterns specific to that directory

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4, tailwind-variants, tailwind-merge, clsx |
| API | tRPC v11 with TanStack React Query |
| Database | PostgreSQL 16 via Drizzle ORM + postgres.js |
| Linting | Biome (primary), ESLint (Next.js rules) |
| Fonts | JetBrains Mono (primary), IBM Plex Mono (secondary) |
| Syntax highlighting | Shiki (rendering), highlight.js (language detection) |
| Animations | @number-flow/react |
| Validation | Zod |
| Error handling | react-error-boundary |

## Project Structure

```
devroast/
  src/
    app/              # Next.js App Router (pages, layouts, API routes)
    components/       # Shared components (navbar, ui/)
      ui/             # Generic design system components
    db/               # Drizzle ORM schema, client, migrations
    lib/              # Shared utility functions
    trpc/             # tRPC setup (client, server, routers)
  scripts/            # CLI scripts (seed)
  specs/              # Feature specifications
  public/             # Static assets
```

## Pencil Design Reference (Pencil MCP)

### Critical Workflow

When working on design implementation tasks:

1. **Always check Pencil selection first** - Before building anything, use `pencil_get_editor_state` to see if something is selected on Pencil
2. **Ask for confirmation** - If something is selected on Pencil, ask the user:
   > "I see you have [Component/Frame Name] selected on Pencil. Should I follow its design and styling?"
3. **Extract exact details** - Use `pencil_batch_get` to read:
   - Text content (fonts, sizes, colors, alignment)
   - Layout properties (gaps, padding, widths, heights)
   - Color variables and styling
   - Component structure and hierarchy
4. **Match faithfully** - Reproduce all stylization exactly:
   - Font families and sizes
   - Colors and fills
   - Spacing (gap, padding)
   - Borders and borders-radius
   - Alignment and layout

### Why This Matters

- Users may forget they have something selected on Pencil
- Selected designs are the source of truth for styling
- Small details (fonts, spacing, colors) must be exact
- Using the wrong design leads to rework

### Example Flow

```
User: "Build the homepage"
Agent: "I see 'Screen 1 - Code Input' is selected on Pencil. Should I follow this design?"
User: "Yes"
Agent: [extracts all design details and implements faithfully]
```

## Import Patterns

### Path Aliases

Always use the `@/` alias for imports from `src/`:

```tsx
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { useTRPC } from "@/trpc/client";
```

### Relative Imports

Use relative imports only for sibling files within the same directory group:

```tsx
// Inside src/app/_components/home-stats.tsx
import { HomeStatsClient } from "./home-stats-client";
```

### Server/Client Boundary Enforcement

- Use `import "server-only"` in modules that must never run on the client
- Use `"use client"` directive only when the component needs browser APIs, hooks, or state
- Components without either directive are server components by default

## Styling Guidelines

### Theme Variables (globals.css)

Always use theme variables from the `@theme inline` block. Never hardcode colors when a theme variable exists.

| Category | Variables |
|----------|-----------|
| Accents | `accent-green`, `accent-amber`, `accent-cyan`, `accent-red`, `accent-blue`, `accent-orange` |
| Backgrounds | `bg-page`, `bg-surface`, `bg-elevated`, `bg-input` |
| Text | `text-primary`, `text-secondary`, `text-tertiary`, `text-muted` |
| Borders | `border-primary`, `border-secondary`, `border-focus` |
| Fonts | `font-mono` (JetBrains Mono), `font-secondary` (IBM Plex Mono), `font-sans` |
| Radius | `radius-m` (16px), `radius-none` (0px), `radius-pill` (9999px) |

Usage in Tailwind: `text-text-primary`, `bg-bg-surface`, `border-border-primary`, `text-accent-green`, `font-mono`, `font-secondary`.

### Inline Styles

Use `style={{ }}` for precise pixel values that don't map to Tailwind utilities:

```tsx
<span style={{ fontSize: "13px", padding: "10px 24px" }}>text</span>
```

Use CSS variable references in inline styles when needed:

```tsx
<span style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>text</span>
```

### Typography

- **JetBrains Mono** (`font-mono`): Code, titles, labels, buttons, section headers
- **IBM Plex Mono** (`font-secondary`): Subtitles, descriptions, stats, secondary text
- Font weights: 400 (normal), 500 (medium), 700 (bold)
- Use `tabular-nums` for numeric displays

## Code Quality

### Biome (Primary Linter)

Biome handles formatting and linting. Configuration:
- Indent: 2 spaces
- Quote style: double quotes
- Import organization: auto-sort enabled
- CSS: Tailwind directives enabled

### ESLint (Next.js Rules)

ESLint handles Next.js-specific rules (core-web-vitals, TypeScript).

### HTML Entities in JSX

Avoid unescaped special characters in JSX text:
- Use template literals for code snippets: `{`eval(prompt("enter code"))`}`
- Use curly braces for static strings: `{"// comment text"}`
- Use HTML entities for symbols: `&gt;`, `&lt;`, `&quot;`

```tsx
// Incorrect - unescaped quotes
<span>eval(prompt("enter code"))</span>

// Correct - template literal
<span>{`eval(prompt("enter code"))`}</span>
```

### Named Exports Only

Never use default exports for components. Always use named exports:

```tsx
export const Button = forwardRef<...>(...);
```

Exception: `page.tsx`, `layout.tsx`, and config files use default exports per Next.js convention.

## Server/Client Component Pattern

### Server Components (default)

Pages and layouts are server components by default. Use for:
- Data fetching and prefetching
- Static rendering
- Composing client components as children

### Client Components

Add `"use client"` only when the component needs:
- `useState`, `useEffect`, `useRef`, or other hooks
- Browser APIs
- Event handlers with state
- Third-party client libraries (Radix UI, etc.)

### Server-Prefetch + Client-Hydration Pattern

This is the primary data fetching pattern:

```tsx
// Server component (page or wrapper)
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export default async function Page() {
  prefetch(trpc.router.procedure.queryOptions());

  return (
    <HydrateClient>
      <ClientComponent />
    </HydrateClient>
  );
}

// Client component
"use client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

function ClientComponent() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.router.procedure.queryOptions());
  // Data is available immediately from hydrated cache
}
```

## Git & Version Control

### Git Commands

**IMPORTANT: Never run any git commands (git add, git commit, git push, etc.) without explicit permission from the user.** This includes:
- `git add` / `git stage`
- `git commit`
- `git push` / `git pull`
- `git reset` / `git revert`
- `git rebase` / `git merge`
- `git checkout` / `git branch`
- Any other git operations

Always ask the user first before executing any git operations, and describe what you plan to do.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run biome      # Lint and check
npm run biome:fix  # Auto-fix lint issues
npx tsc --noEmit   # TypeScript check
npm run db:generate # Generate migrations from schema changes
npm run db:push     # Push schema directly to database
npm run db:migrate  # Run migration files
npm run db:studio   # Open Drizzle Studio
npm run seed        # Seed database with test data
```

## Environment Variables

Stored in `.env.local` (git-ignored). Required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

Optional:

| Variable | Description |
|----------|-------------|
| `AI_MODEL_VERSION` | AI model version string for analysis records |

## See Also

- `src/app/AGENTS.md` - Page and route patterns
- `src/components/AGENTS.md` - Shared component organization
- `src/components/ui/AGENTS.md` - UI component patterns
- `src/trpc/AGENTS.md` - tRPC setup and data fetching patterns
- `src/db/AGENTS.md` - Database schema and migration patterns
- `specs/AGENTS.md` - Feature specification format
