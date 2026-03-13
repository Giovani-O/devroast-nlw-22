import { type ClassValue, clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const cardVariants = tv({
  base: "rounded-xl border border-border-primary bg-bg-surface p-5",
  variants: {
    variant: {
      default: "",
      elevated: "bg-bg-elevated shadow-lg",
      ghost: "border-none bg-transparent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    CardVariants {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
