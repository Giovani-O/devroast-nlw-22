import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

/**
 * Skeleton - Animated placeholder for loading states.
 * Uses className-based sizing (shadcn pattern):
 *   <Skeleton className="h-4 w-[200px]" />
 */
export const Skeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("animate-pulse bg-bg-elevated", className)}
    ref={ref}
    {...props}
  />
));

Skeleton.displayName = "Skeleton";
