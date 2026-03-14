import { forwardRef, type HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils";

const badgeVariants = tv({
  base: "inline-flex items-center gap-2 rounded-md font-mono text-xs font-medium",
  variants: {
    variant: {
      critical:
        "bg-accent-red/10 text-accent-red border border-accent-red/30 px-2 py-1",
      warning:
        "bg-accent-amber/10 text-accent-amber border border-accent-amber/30 px-2 py-1",
      good: "bg-accent-green/10 text-accent-green border border-accent-green/30 px-2 py-1",
      verdict:
        "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 px-2 py-1",
    },
  },
  defaultVariants: {
    variant: "good",
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    BadgeVariants {}

/**
 * Base Badge component with support for multiple status variants
 * Use semantic sub-components (Badge.Critical, Badge.Warning, etc.) for simpler usage
 */
const BadgeComponent = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

BadgeComponent.displayName = "Badge";

/**
 * Semantic sub-components for common badge patterns
 * These reduce prop verbosity by providing sensible defaults
 */

/** Critical badge - Red style for critical/error status */
const BadgeCritical = forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "critical", ...props }, ref) => (
    <BadgeComponent ref={ref} variant={variant} {...props} />
  ),
);
BadgeCritical.displayName = "Badge.Critical";

/** Warning badge - Amber style for warning status */
const BadgeWarning = forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "warning", ...props }, ref) => (
    <BadgeComponent ref={ref} variant={variant} {...props} />
  ),
);
BadgeWarning.displayName = "Badge.Warning";

/** Good badge - Green style for success/good status */
const BadgeGood = forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "good", ...props }, ref) => (
    <BadgeComponent ref={ref} variant={variant} {...props} />
  ),
);
BadgeGood.displayName = "Badge.Good";

/** Verdict badge - Cyan style for verdict/info status */
const BadgeVerdict = forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "verdict", ...props }, ref) => (
    <BadgeComponent ref={ref} variant={variant} {...props} />
  ),
);
BadgeVerdict.displayName = "Badge.Verdict";

/**
 * Compound Badge component with semantic sub-components
 * Usage:
 * - <Badge /> - Base component with full control over variants
 * - <Badge.Critical /> - Critical/error status badge
 * - <Badge.Warning /> - Warning status badge
 * - <Badge.Good /> - Success/good status badge
 * - <Badge.Verdict /> - Info/verdict status badge
 */
export const Badge = Object.assign(BadgeComponent, {
  Critical: BadgeCritical,
  Warning: BadgeWarning,
  Good: BadgeGood,
  Verdict: BadgeVerdict,
});
