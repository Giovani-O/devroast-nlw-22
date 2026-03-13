import { type ClassValue, clsx } from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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

Button.displayName = "Button";
