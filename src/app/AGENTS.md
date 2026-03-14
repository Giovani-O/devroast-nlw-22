# Pages & Routes Guidelines

## Overview

This directory contains the Next.js App Router pages and layout files. All pages follow the design system and styling guidelines defined in the project.

## Directory Structure

```
src/app/
├── AGENTS.md              # This file
├── layout.tsx             # Root layout (persistent navbar, main wrapper)
├── page.tsx               # Homepage
├── globals.css            # Global styles and theme variables
└── components/            # Page-specific components (optional)
```

## Layout Pattern

### Root Layout (`layout.tsx`)

The root layout provides:
- **Persistent navbar** - Displayed on all pages
- **Content wrapper** - Max-width container for centered content
- **Global styling** - Dark theme, font setup
- **Font imports** - JetBrains Mono (primary), IBM Plex Mono (secondary)

**Key responsibilities:**
- Import and render the `<Navbar />` component
- Wrap `{children}` in a centered flex container with `max-w-[960px]`
- Apply consistent padding (top: 80px, sides: 40px)
- Set global body styles: `bg-bg-page`, `text-text-primary`

### Page Implementation

Each page should:
1. Use `"use client"` directive if it uses client-side features (hooks, state)
2. Wrap content in a centered flex container with proper gaps
3. Follow the theme color and typography guidelines
4. Match the Pencil design exactly for styling

## Styling Guidelines

### Colors

Use theme variables from `globals.css`:
- **Backgrounds**: `bg-page`, `bg-surface`, `bg-elevated`, `bg-input`
- **Text**: `text-primary`, `text-secondary`, `text-tertiary`
- **Accents**: `accent-green`, `accent-amber`, `accent-red`, `accent-blue`, `accent-orange`
- **Borders**: `border-primary`, `border-secondary`, `border-focus`

### Typography

- **Primary**: JetBrains Mono (monospace, code-like text)
- **Secondary**: IBM Plex Mono (monospace, descriptions)
- **Font sizes**: Use inline `style={{ fontSize: "Xpx" }}` when exact pixel sizes are needed
- **Weights**: normal (400), medium (500), bold (700)

### Spacing

Spacing follows an 8px base unit:
- `gap-1` = 4px (`spacing-xs`)
- `gap-2` = 8px (`spacing-sm`)
- `gap-3` = 12px
- `gap-4` = 16px (`spacing-md`)
- `gap-6` = 24px (`spacing-lg`)
- `gap-8` = 32px
- Use `style={{ padding: "Xpx" }}` for custom padding values

### Sections

Content sections should:
- Have `max-w-[780px]` for main content (code editor, actions)
- Have `max-w-[960px]` for wider sections (leaderboard)
- Use `gap-8` (32px) between major sections
- Center using `mx-auto` on the section itself or parent `flex-col items-center`

## Design System Components

Use UI components from `@/components/ui/`:
- **Button**: For actions and CTAs
  - Variant: `default`, `secondary`, `ghost`, `outline`, `destructive`, `link`
  - Size: `default`, `sm`, `lg`, `icon`
  - Rounded: `none`, `sm`, `default`, `lg`, `full`
- **Toggle**: For boolean switches
- **Card**: For grouped content
- **Badge**: For labels and tags

### Component Customization

When components need custom sizing:
1. Use the `style` prop for precise values
2. Use `className` prop for Tailwind utilities
3. Avoid hardcoding colors - use theme variables

Example:
```tsx
<Button
  variant="default"
  rounded="none"
  className="font-mono"
  style={{ fontSize: "13px", padding: "10px 24px" }}
>
  $ roast_my_code
</Button>
```

## Common Patterns

### Centered Section
```tsx
<div className="w-full max-w-[780px] flex flex-col gap-3 mx-auto">
  {/* Content */}
</div>
```

### Title with Icon/Prefix
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

### Table with Multiple Columns
```tsx
<div className="flex items-start" style={{ fontSize: "12px", padding: "16px 20px" }}>
  <span className="font-mono flex-shrink-0" style={{ width: "50px" }}>
    {/* Rank */}
  </span>
  <span className="font-mono flex-shrink-0" style={{ width: "70px" }}>
    {/* Score */}
  </span>
  <div className="flex-1">
    {/* Content - fills remaining space */}
  </div>
  <span className="font-mono flex-shrink-0" style={{ width: "100px" }}>
    {/* Lang */}
  </span>
</div>
```

### Multi-line Code Display
```tsx
<div className="flex flex-col gap-0.5">
  <span className="font-mono text-text-primary">
    {`for (let i = 0; i < arr.length; i++) {`}
  </span>
  <span className="font-mono text-text-primary">
    {`  console.log(arr[i]);`}
  </span>
  <span className="font-mono text-text-primary">{`}`}</span>
</div>
```

### Escaping HTML Entities in JSX

When rendering text that contains special characters like quotes (`"`), use template literals or wrap in curly braces to avoid ESLint errors:

**❌ Incorrect** - Unescaped quotes in JSX:
```tsx
<span>eval(prompt("enter code"))</span>
```

**✅ Correct** - Use template literals:
```tsx
<span>{`eval(prompt("enter code"))`}</span>
```

**✅ Also correct** - Use curly braces for static strings with entities:
```tsx
<span>{"// the worst code on the internet"}</span>
```

For HTML entities like `&gt;` (>), `&lt;` (<), use them directly in JSX strings:
```tsx
<a href="/leaderboard">view full leaderboard &gt;&gt;</a>
```

## Development Workflow

1. **Check Pencil selection** - Use `pencil_get_editor_state` to see current selection
2. **Ask for confirmation** - If a page/component is selected, confirm it should be followed
3. **Extract design details** - Use `pencil_batch_get` for exact measurements and colors
4. **Implement faithfully** - Match all styling details from Pencil
5. **Test and verify** - Run `npm run biome` and `npx tsc --noEmit`

## Quality Checklist

- [ ] All text content matches Pencil design exactly
- [ ] All font sizes, weights, and families match Pencil
- [ ] All colors use theme variables or exact Pencil colors
- [ ] All spacing and padding matches Pencil (within 1-2px tolerance)
- [ ] All borders, radius, and effects are implemented
- [ ] TypeScript types are correct (`npx tsc --noEmit`)
- [ ] Biome linting passes (`npm run biome`)
- [ ] No console errors when running dev server
- [ ] Responsive behavior matches design intent
