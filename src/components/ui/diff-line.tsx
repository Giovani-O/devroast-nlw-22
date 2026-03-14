import { forwardRef, type HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils";

const diffLineVariants = tv({
  base: "font-mono text-sm px-4 py-2",
  variants: {
    variant: {
      removed: "bg-[#1A0A0A] text-accent-red",
      added: "bg-[#0A1A0F] text-accent-green",
      context: "bg-transparent text-text-primary",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

export type DiffLineVariants = VariantProps<typeof diffLineVariants>;

export interface DiffLineProps
  extends HTMLAttributes<HTMLDivElement>,
    DiffLineVariants {}

/**
 * DiffLine component - Display a line of code diff with appropriate styling
 * Shows removed, added, or context lines with distinct visual indicators
 */
export const DiffLine = forwardRef<HTMLDivElement, DiffLineProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(diffLineVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

DiffLine.displayName = "DiffLine";
