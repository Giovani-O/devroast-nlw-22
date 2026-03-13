import { type ClassValue, clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
