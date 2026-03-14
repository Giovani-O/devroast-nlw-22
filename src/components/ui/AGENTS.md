# UI Components Guidelines

## Overview

This directory contains generic UI components built with Tailwind CSS, tailwind-merge, and tailwind-variants.

## Tech Stack

- **Tailwind CSS v4** - Styling
- **tailwind-merge** - Merges Tailwind classes without conflicts
- **tailwind-variants** - Component variants and type-safe class names
- **clsx** - Utility for constructing className strings

## Creating Components

### Basic Structure

```tsx
import { type ComponentHTMLAttributes, forwardRef } from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  extends ComponentHTMLAttributes<HTMLDivElement>,
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

### Rules

1. **Named exports only** - Never use default exports
2. **Extend native props** - Components should extend their HTML element's native attributes (e.g., `ButtonHTMLAttributes<HTMLButtonElement>`)
3. **Use forwardRef** - Enable ref forwarding for parent component access
4. **Use tailwind-variants** - Define all variant styles using TV for consistency
5. **Use theme variables** - Always use theme variables from `globals.css` instead of hardcoded values
6. **Display name** - Set `ComponentName.displayName` after forwardRef

### Theme Variables

Available theme variables (defined in the global CSS):

| Category | Variables |
|----------|-----------|
| Colors | `accent-green`, `accent-amber`, `accent-cyan`, `accent-red`, `accent-blue`, `accent-orange` |
| Backgrounds | `bg-page`, `bg-surface`, `bg-elevated`, `bg-input` |
| Text | `text-primary`, `text-secondary`, `text-tertiary`, `text-muted` |
| Borders | `border-primary`, `border-secondary`, `border-focus` |
| Radius | `rounded-none`, `rounded-m`, `rounded-pill` |

## Linting

Run Biome before committing:

```bash
npm run biome
```

Auto-fix issues:

```bash
npm run biome:fix
```

### Code Quality Rules

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

## File Naming

- Use kebab-case: `button.tsx`, `input-field.tsx`
- Export component as named export matching filename: `export const Button`

## Examples Page

All UI components must be documented in the examples page within the app directory.

### When Creating a New Component

1. Create the component in this directory
2. Add a new section to the examples page following the existing pattern:

```tsx
import { ComponentName } from "@/components/ui/component-name";

export default function ComponentsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-text-primary">ComponentName</h2>
      <p className="text-text-secondary text-sm">
        Description of what the component does.
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-text-tertiary text-sm">Variants</h3>
          <div className="flex flex-wrap gap-4">
            <ComponentName>default</ComponentName>
            <ComponentName variant="secondary">secondary</ComponentName>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-text-tertiary text-sm">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <ComponentName size="sm">small</ComponentName>
            <ComponentName size="default">default</ComponentName>
            <ComponentName size="lg">large</ComponentName>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### When Editing an Existing Component

1. Review the current examples in the examples page
2. Check if any of the following changes were made:
   - New variants added, removed, or modified
   - New sizes added, removed, or modified
   - New props added that affect rendering
   - Default values changed
3. If any changes affect the examples, update the page accordingly
4. Run the lint and typecheck commands to verify everything passes
