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

## UI Components

See the UI components directory for guidelines on creating and maintaining UI components.

## Pages & Routes

See the pages directory for guidelines on creating and maintaining pages.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Biome (linting/formatting)
- tailwind-variants + tailwind-merge

## Code Quality

### ESLint Rules

**HTML Entities in JSX** - Avoid unescaped special characters in JSX text:
- Use template literals (backticks) for code snippets: `{`eval(prompt("enter code"))`}`
- Use curly braces for static strings: `{"// comment text"}`
- Use HTML entities for symbols: `&gt;`, `&lt;`, `&quot;` in JSX attributes/strings
- This prevents `react/no-unescaped-entities` linting errors

Example:
```tsx
// ❌ Incorrect - unescaped quotes
<span>eval(prompt("enter code"))</span>

// ✅ Correct - template literal
<span>{`eval(prompt("enter code"))`}</span>

// ✅ Correct - HTML entities in attributes
<a href="/leaderboard">view full leaderboard &gt;&gt;</a>
```

## Git & Version Control

### Git Commands

**⚠️ IMPORTANT: Never run any git commands (git add, git commit, git push, etc.) without explicit permission from the user.** This includes:
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
npm run dev       # Start dev server
npm run biome     # Lint and check
npm run biome:fix # Auto-fix lint issues
npx tsc --noEmit # TypeScript check
```
