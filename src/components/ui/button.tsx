import { type ButtonHTMLAttributes, forwardRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils";

const buttonVariants = tv({
  base: "inline-flex items-center justify-center gap-2 font-mono text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      default:
        "bg-accent-green text-bg-page hover:bg-accent-green/90 active:bg-accent-green/80",
      destructive:
        "bg-accent-red text-white hover:bg-accent-red/90 active:bg-accent-red/80",
      outline:
        "border border-border-secondary bg-transparent hover:bg-bg-elevated hover:text-text-primary",
      secondary: "bg-bg-elevated text-text-primary hover:bg-bg-elevated/80",
      ghost: "hover:bg-bg-elevated hover:text-text-primary",
      link: "text-accent-green underline-offset-4 hover:underline",
    },
    size: {
      default: "h-auto px-6 py-2.5",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-8 text-sm",
      icon: "h-10 w-10",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-[4px]",
      default: "rounded-m",
      lg: "rounded-[24px]",
      full: "rounded-pill",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    rounded: "default",
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {}

/**
 * Base Button component with support for multiple variants, sizes, and border radius options
 * Use semantic sub-components (Button.Primary, Button.Destructive, etc.) for simpler usage
 */
const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

ButtonComponent.displayName = "Button";

/**
 * Semantic sub-components for common button patterns
 * These reduce prop verbosity by providing sensible defaults
 */

/** Primary button - Green/default style for primary actions */
const ButtonPrimary = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "default", size = "default", rounded = "default", ...props },
    ref,
  ) => (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      {...props}
    />
  ),
);
ButtonPrimary.displayName = "Button.Primary";

/** Destructive button - Red style for destructive actions */
const ButtonDestructive = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "destructive",
      size = "default",
      rounded = "default",
      ...props
    },
    ref,
  ) => (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      {...props}
    />
  ),
);
ButtonDestructive.displayName = "Button.Destructive";

/** Secondary button - Elevated background for secondary actions */
const ButtonSecondary = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "default", rounded = "default", ...props },
    ref,
  ) => (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      {...props}
    />
  ),
);
ButtonSecondary.displayName = "Button.Secondary";

/** Ghost button - Minimal style for tertiary actions */
const ButtonGhost = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "ghost", size = "default", rounded = "default", ...props },
    ref,
  ) => (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      {...props}
    />
  ),
);
ButtonGhost.displayName = "Button.Ghost";

/** Outline button - Border style for outline actions */
const ButtonOutline = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "outline", size = "default", rounded = "default", ...props },
    ref,
  ) => (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      {...props}
    />
  ),
);
ButtonOutline.displayName = "Button.Outline";

/** Link button - Text only style for link-like buttons */
const ButtonLink = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "link", size = "default", rounded = "default", ...props },
    ref,
  ) => (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      rounded={rounded}
      {...props}
    />
  ),
);
ButtonLink.displayName = "Button.Link";

/**
 * Compound Button component with semantic sub-components
 * Usage:
 * - <Button /> - Base component with full control over variants
 * - <Button.Primary /> - Primary action button
 * - <Button.Destructive /> - Destructive action button
 * - <Button.Secondary /> - Secondary action button
 * - <Button.Ghost /> - Ghost/minimal button
 * - <Button.Outline /> - Outline button
 * - <Button.Link /> - Link-style button
 */
export const Button = Object.assign(ButtonComponent, {
  Primary: ButtonPrimary,
  Destructive: ButtonDestructive,
  Secondary: ButtonSecondary,
  Ghost: ButtonGhost,
  Outline: ButtonOutline,
  Link: ButtonLink,
});
