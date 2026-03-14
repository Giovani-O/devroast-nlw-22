import { type ClassValue, clsx } from "clsx";
import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

/**
 * Merge and combine class values with Tailwind CSS support
 * Combines clsx for conditional classes with twMerge for Tailwind class resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Base props for all UI components that extend HTML elements
 * Provides consistent typing across all components
 */
export type BaseComponentProps<T extends HTMLElement = HTMLDivElement> =
  HTMLAttributes<T>;
