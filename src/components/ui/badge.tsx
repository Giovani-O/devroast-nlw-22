import { type ClassValue, clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
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

Badge.displayName = "Badge";
