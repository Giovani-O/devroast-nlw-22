# Project Guidelines for Agents

## Overview

This file documents conventions that AI agents should follow when working on this project.

## AGENTS.md Files

AGENTS.md files should **document patterns**, not direct file references. They serve as guidelines for how to work with specific parts of the project.

### Naming

All agent guidelines files should be named in **UPPERCASE**: `AGENTS.md`

### Structure

- Root-level AGENTS.md: Documents project-wide patterns
- Directory-level AGENTS.md: Documents patterns specific to that directory

## UI Components

See the UI components directory for guidelines on creating and maintaining UI components.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Biome (linting/formatting)
- tailwind-variants + tailwind-merge

## Commands

```bash
npm run dev       # Start dev server
npm run biome     # Lint and check
npm run biome:fix # Auto-fix lint issues
npx tsc --noEmit # TypeScript check
```
