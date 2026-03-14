# UI Components Guidelines

## Overview

This directory contains generic UI components built with **composition patterns**, Tailwind CSS, tailwind-merge, and tailwind-variants. Components use semantic sub-components and compound component patterns to reduce prop complexity and improve API ergonomics.

## Tech Stack

- **Tailwind CSS v4** - Styling
- **tailwind-merge** - Merges Tailwind classes without conflicts
- **tailwind-variants** - Component variants and type-safe class names
- **clsx** - Utility for constructing className strings

## Composition Pattern

### Shared Utilities

All components use the shared `cn()` helper from `utils.ts`:

```tsx
import { cn } from "./utils";

// cn() combines clsx and twMerge for class merging
className={cn(buttonVariants({ variant, size, className }))}
```

### Compound Components

Complex components are built using the **compound component pattern** with semantic sub-components. This reduces prop proliferation and improves API clarity.

#### Example: Button Component

```tsx
// Using the base Button component (full control)
<Button variant="default" size="lg" rounded="default">
  Click me
</Button>

// Using semantic sub-components (simpler API)
<Button.Primary size="lg">
  Click me
</Button.Primary>

<Button.Destructive>
  Delete
</Button.Destructive>

<Button.Ghost>
  Cancel
</Button.Ghost>
```

#### Available Compound Components

1. **Button** - Primary action component
   - `Button` - Base with full variant control
   - `Button.Primary` - Default/green button (default variant)
   - `Button.Destructive` - Red/destructive button
   - `Button.Secondary` - Secondary button
   - `Button.Ghost` - Minimal button
   - `Button.Outline` - Outlined button
   - `Button.Link` - Link-style button

2. **Badge** - Status indicator component
   - `Badge` - Base with full variant control
   - `Badge.Critical` - Red/error status
   - `Badge.Warning` - Amber/warning status
   - `Badge.Good` - Green/success status (default)
   - `Badge.Verdict` - Cyan/info status

3. **Card** - Content container component
   - `Card` - Base container
   - `Card.Header` - Header section
   - `Card.Title` - Title text (use inside Header)
   - `Card.Description` - Description text (use inside Header)
   - `Card.Content` - Main content area
   - `Card.Footer` - Footer section

   ```tsx
   <Card variant="default">
     <Card.Header>
       <Card.Title>Title</Card.Title>
       <Card.Description>Description</Card.Description>
     </Card.Header>
     <Card.Content>
       Main content here
     </Card.Content>
     <Card.Footer>
       Footer content
     </Card.Footer>
   </Card>
   ```

4. **Table** - Table structure component
   - `Table` - Base table container
   - `Table.Header` - Header section (typically contains one row)
   - `Table.Body` - Body section (contains data rows)
   - `Table.Row` - Individual row
   - `Table.Cell` - Individual cell (use inside Row)

   ```tsx
   <Table>
     <Table.Header>
       <Table.Row>
         <Table.Cell>Column 1</Table.Cell>
         <Table.Cell>Column 2</Table.Cell>
       </Table.Row>
     </Table.Header>
     <Table.Body>
       <Table.Row>
         <Table.Cell>Data 1</Table.Cell>
         <Table.Cell>Data 2</Table.Cell>
       </Table.Row>
     </Table.Body>
   </Table>
   ```

### Creating Compound Components

When creating a new compound component:

1. **Create the base component** with full variant control
2. **Create semantic sub-components** with reasonable defaults
3. **Use `Object.assign()`** to attach sub-components:

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

export const Button = Object.assign(ButtonComponent, {
  Primary: ButtonPrimary,
});
```

## Creating Components

### Basic Structure (Variant-Based)

For simple components with variants (not using composition):

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

### Rules

1. **Named exports only** - Never use default exports
2. **Extend native props** - Components should extend their HTML element's native attributes (e.g., `ButtonHTMLAttributes<HTMLButtonElement>`)
3. **Use forwardRef** - Enable ref forwarding for parent component access
4. **Use tailwind-variants** - Define all variant styles using TV for consistency
5. **Use shared `cn()` utility** - Import from `./utils` instead of defining locally
6. **Use theme variables** - Always use theme variables from `globals.css` instead of hardcoded values
7. **Display name** - Set `ComponentName.displayName` after forwardRef
8. **Add JSDoc comments** - Document component purpose and usage

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
- Utility files: `utils.ts` for shared helpers

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
   - New sub-components added
3. If any changes affect the examples, update the page accordingly
4. Run the lint and typecheck commands to verify everything passes

