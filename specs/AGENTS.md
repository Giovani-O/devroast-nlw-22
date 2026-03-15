# Specs Directory Guidelines

## Overview

Spec files document **what to build and why** before implementation begins. They are the source of truth for a feature's scope, decisions, and architecture.

## File Naming

`SCREAMING_SNAKE_CASE_SPEC.md` -- e.g. `AUTH_SPEC.md`, `AI_PIPELINE_SPEC.md`

## Required Structure

```md
# Feature Name -- Specification

## Project Context
- Project, tech stack, target files, current state

## Overview
One paragraph: what the feature does and why it's needed.

## Decisions
Table of key questions and their chosen answers. Document rejected options with reasons.

## Architecture
Directory/file structure, component hierarchy, data flow, interfaces/types.
Include code snippets for non-obvious APIs or integration points.

## Implementation Plan
Phased checklist of concrete tasks. Each phase should be independently shippable.
- [ ] Uncompleted task
- [x] Completed task

## References
Links to docs, related files in the codebase, external examples.
```

## Rules

- **Decisions first** -- capture the "why" before writing the "how". If a decision isn't made, note it as open.
- **Be specific** -- reference exact file paths, line numbers, and function names where applicable.
- **Code samples for non-obvious integrations** -- include minimal snippets for third-party APIs or tricky patterns; skip boilerplate.
- **No implementation noise** -- specs are not tutorials. Omit generic setup instructions that any developer can look up.
- **Keep checklists actionable** -- each task should be completable and verifiable in isolation.
- **Update as you go** -- check off tasks and record any decisions that changed during implementation.

## Existing Specs

| Spec | Purpose |
|------|---------|
| `CODE_EDITOR_SPEC.md` | Live code editor with Shiki syntax highlighting and highlight.js language detection |
| `DRIZZLE_IMPLEMENTATION_SPEC.md` | Drizzle ORM integration: schema, client, migrations, seed script |
| `TRPC_IMPLEMENTATION_SPEC.md` | tRPC v11 setup with TanStack React Query, server prefetch, and client hydration |
