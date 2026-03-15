# UI Components Guidelines

## Overview

This directory contains generic UI components built with **composition patterns**, Tailwind CSS, tailwind-merge, and tailwind-variants. Components use semantic sub-components and compound component patterns to reduce prop complexity and improve API ergonomics.

## Tech Stack

- **Tailwind CSS v4** - Styling
- **tailwind-merge** - Merges Tailwind classes without conflicts
- **tailwind-variants** - Component variants and type-safe class names
- **clsx** - Utility for constructing className strings
- **Radix UI** - Headless primitives (`@radix-ui/react-switch` for Toggle)
- **Shiki** - Syntax highlighting (server-side in CodeBlock, client-side in CodeEditor)
- **highlight.js** - Language auto-detection (CodeEditor)

## Component Inventory

| Component | File | Type | `"use client"` | Pattern |
|-----------|------|------|-----------------|---------|
| Button | `button.tsx` | Interactive | No | forwardRef + compound (Object.assign) |
| Badge | `badge.tsx` | Display | No | forwardRef + compound (Object.assign) |
| Card | `card.tsx` | Layout | No | forwardRef + compound (Object.assign) |
| Table | `table-row.tsx` | Layout | No | forwardRef + compound (Object.assign) |
| Toggle | `toggle.tsx` | Interactive | Yes | forwardRef (Radix primitive) |
| CodeBlock | `code-block.tsx` | Display | No | Async server component |
| CodeEditor | `code-editor.tsx` | Interactive | Yes | forwardRef (complex state) |
| DiffLine | `diff-line.tsx` | Display | No | forwardRef (simple variant) |
| ScoreRing | `score-ring.tsx` | Display | Yes | forwardRef (SVG-based) |

## Shared Utilities

All components use the shared `cn()` helper from `utils.ts`:

```tsx
import { cn } from "./utils";

// cn() combines clsx and twMerge for class merging
className={cn(buttonVariants({ variant, size, className }))}
```

The file also exports a `BaseComponentProps<T>` type alias for `HTMLAttributes<T>`, though current components import `HTMLAttributes` directly from React.

## Compound Components

Complex components are built using the **compound component pattern** with semantic sub-components attached via `Object.assign()`. There are two sub-patterns:

### Variant Presets (Button, Badge)

Sub-components wrap the base component with a pre-set default variant. Users can still override any variant prop.

```tsx
// Base component with full control
<Button variant="default" size="lg" rounded="default">Click me</Button>

// Semantic sub-components with defaults
<Button.Primary size="lg">Click me</Button.Primary>
<Button.Destructive>Delete</Button.Destructive>
<Button.Ghost>Cancel</Button.Ghost>
```

### Structural Composition (Card, Table)

Sub-components are separate elements intended to be nested. Each has its own styling and may extend different HTML element types.

```tsx
<Card variant="default">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>Main content here</Card.Content>
  <Card.Footer>Footer content</Card.Footer>
</Card>
```

```tsx
<Table>
  <Table.Header>
    <Table.Row>
      <Table.Cell>Column 1</Table.Cell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Data 1</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

### Available Sub-Components

1. **Button** - `Primary`, `Destructive`, `Secondary`, `Ghost`, `Outline`, `Link`
2. **Badge** - `Critical`, `Warning`, `Good`, `Verdict`
3. **Card** - `Header`, `Title`, `Description`, `Content`, `Footer`
4. **Table** - `Header`, `Body`, `Row`, `Cell`

### Creating Compound Components

```tsx
const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, className }))} ref={ref} {...props} />
  ),
);
ButtonComponent.displayName = "Button";

const ButtonPrimary = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", ...props }, ref) => (
    <ButtonComponent ref={ref} variant={variant} {...props} />
  ),
);
ButtonPrimary.displayName = "Button.Primary";

export const Button = Object.assign(ButtonComponent, {
  Primary: ButtonPrimary,
});
```

## Creating Components

### Standard Pattern (Variant-Based with forwardRef)

This is the default pattern for most components:

```tsx
import { forwardRef, type HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils";

const componentNameVariants = tv({
  base: "base classes here",
  variants: {
    variant: {
      default: "default variant classes",
      secondary: "secondary variant classes",
    },
    size: {
      sm: "small size classes",
      default: "default size classes",
      lg: "large size classes",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ComponentNameVariants = VariantProps<typeof componentNameVariants>;

export interface ComponentNameProps
  extends HTMLAttributes<HTMLDivElement>,
    ComponentNameVariants {}

export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(componentNameVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

ComponentName.displayName = "ComponentName";
```

### Async Server Components

Some components (like CodeBlock) are async server components that do not use forwardRef:

```tsx
export interface CodeBlockProps {
  code: string;
  language?: string;
}

export async function CodeBlock({ code, language }: CodeBlockProps) {
  const html = await codeToHtml(code, { lang: language, theme: "..." });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

These components:
- Do NOT use `forwardRef` or `displayName`
- Do NOT extend native HTML attributes
- Define custom props interfaces
- Can use `await` for async operations (e.g., Shiki syntax highlighting)
- May use `dangerouslySetInnerHTML` with a `biome-ignore` comment for rendered HTML

### Rules

1. **Named exports only** - Never use default exports
2. **Extend native props** - Components should extend their HTML element's native attributes (e.g., `ButtonHTMLAttributes<HTMLButtonElement>`). Exception: async server components and components with complex custom props
3. **Use forwardRef** - Enable ref forwarding for parent component access. Exception: async server components, plain function components
4. **Use tailwind-variants** - Define variant styles using `tv()` when the component has visual variants. Components without variants may use `cn()` directly
5. **Use shared `cn()` utility** - Import from `./utils`
6. **Use theme variables** - Always use theme variables from `globals.css` instead of hardcoded hex values
7. **Display name** - Set `ComponentName.displayName` after forwardRef
8. **JSDoc comments** - Document component purpose and usage
9. **Export variant types** - Export `VariantProps<typeof ...>` as a named type when using `tv()`

### cn() Usage Patterns

Two patterns exist in the codebase:

```tsx
// Pattern 1: className passed INTO tv() (preferred for variant components)
className={cn(componentVariants({ variant, size, className }))}

// Pattern 2: className as second arg to cn() (used for non-variant sub-components)
className={cn(cardHeaderVariants(), className)}
```

### "use client" Directive

Only add `"use client"` when the component requires:
- React hooks (`useState`, `useEffect`, `useRef`)
- Browser APIs or event handlers with state
- Third-party client libraries (Radix UI primitives)

Components without this directive can be used in both server and client components.

## Theme Variables

Available theme variables (defined in `globals.css`):

| Category | Variables |
|----------|-----------|
| Accents | `accent-green`, `accent-amber`, `accent-cyan`, `accent-red`, `accent-blue`, `accent-orange` |
| Backgrounds | `bg-page`, `bg-surface`, `bg-elevated`, `bg-input` |
| Text | `text-primary`, `text-secondary`, `text-tertiary`, `text-muted` |
| Borders | `border-primary`, `border-secondary`, `border-focus` |
| Radius | `radius-none`, `radius-m`, `radius-pill` |

Usage: `text-text-primary`, `bg-bg-surface`, `border-border-primary`, `text-accent-green`.

For inline styles, reference CSS variables: `var(--color-accent-green)`, `var(--font-mono)`.

## File Naming

- Use kebab-case: `button.tsx`, `code-editor.tsx`, `score-ring.tsx`
- Primary export should match filename: `button.tsx` exports `Button`, `code-editor.tsx` exports `CodeEditor`
- Utility files: `utils.ts` for shared helpers

## Linting

Run Biome before committing:

```bash
npm run biome      # Check
npm run biome:fix  # Auto-fix
```

### HTML Entities in JSX

Avoid unescaped special characters in JSX text:

```tsx
// Incorrect - unescaped quotes
<span>eval(prompt("enter code"))</span>

// Correct - template literal
<span>{`eval(prompt("enter code"))`}</span>
```

### dangerouslySetInnerHTML

When using `dangerouslySetInnerHTML` (e.g., for Shiki HTML output), suppress the Biome lint with:

```tsx
// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates safe HTML
<div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
```

## Examples Page

A component preview page exists at `src/app/_components/page.tsx` (hidden behind the underscore prefix). It demonstrates all UI component variants and serves as living documentation. Remove the underscore from the folder name to view at `/components`.

### When Creating a New Component

1. Create the component in this directory
2. Add a new section to the examples page following the existing pattern
3. Show all variants, sizes, and states

### When Editing an Existing Component

1. Check if new variants, sizes, or props were added/changed
2. Update the examples page if any visual changes were made
3. Run `npm run biome` and `npx tsc --noEmit` to verify
