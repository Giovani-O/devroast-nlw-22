"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import { type ClassValue, clsx } from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const toggleVariants = tv({
  base: "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:bg-accent-green data-[state=unchecked]:bg-border-secondary",
  variants: {
    size: {
      default: "h-6 w-11",
      sm: "h-5 w-9",
      lg: "h-7 w-14",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type ToggleVariants = VariantProps<typeof toggleVariants>;

export interface ToggleProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ToggleVariants {}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <SwitchPrimitives.Root
        className={cn(toggleVariants({ size, className }))}
        ref={ref}
        {...props}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block rounded-full bg-white transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1",
            size === "sm" && "data-[state=checked]:translate-x-4",
            size === "lg" &&
              "data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-1.5",
          )}
        />
      </SwitchPrimitives.Root>
    );
  },
);

Toggle.displayName = "Toggle";
