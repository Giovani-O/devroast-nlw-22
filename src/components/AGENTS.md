# Components Directory Guidelines

## Overview

This directory contains shared components used across the application. It is organized into two levels:

- **Root level** (`src/components/`): App-specific shared components (navbar, headers, etc.)
- **`ui/` subdirectory**: Generic, reusable design system primitives (buttons, cards, badges, etc.)

## Directory Structure

```
src/components/
├── AGENTS.md      # This file
├── navbar.tsx     # Persistent navigation bar (server component)
└── ui/
    ├── AGENTS.md  # UI component patterns (see ui/AGENTS.md)
    ├── utils.ts   # Shared cn() utility
    ├── button.tsx
    ├── badge.tsx
    ├── card.tsx
    ├── toggle.tsx
    ├── code-block.tsx
    ├── code-editor.tsx
    ├── diff-line.tsx
    ├── score-ring.tsx
    └── table-row.tsx
```

## Placement Rules

### Root Level (`src/components/`)

Place components here when they are:
- App-specific (tied to DevRoast's layout or branding)
- Used across multiple pages but not generic enough for `ui/`
- Examples: `navbar.tsx`

These components:
- May use `next/link`, app-specific routes, or business logic
- Are typically server components (no `"use client"`)
- Use named exports (no default exports)
- Do not need forwardRef, tv(), or variant patterns
- Use theme variables from `globals.css`

### UI Subdirectory (`src/components/ui/`)

Place components here when they are:
- Generic, reusable primitives with no app-specific logic
- Configured via props/variants, not hardcoded content
- See `ui/AGENTS.md` for detailed component patterns

## Import Pattern

All components are imported via the `@/` alias:

```tsx
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

## Navbar Pattern

The Navbar is a **server component** (no `"use client"`, no hooks, no state):
- Renders with `next/link` for client-side navigation
- Uses theme variables: `bg-bg-page`, `border-border-primary`, `text-accent-green`, `text-text-primary`, `text-text-secondary`
- Fixed height (`h-14`), full width, border-bottom
- Logo: green `>` prefix + "devroast" text
- Navigation links: monospace, secondary text color with hover transition
- Mounted in the root layout (`src/app/layout.tsx`), appears on every page
