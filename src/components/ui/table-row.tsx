import { type ClassValue, clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TableRowProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TableRow = forwardRef<HTMLDivElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center border-b border-border-primary px-5 py-4",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);

TableRow.displayName = "TableRow";

export interface TableCellProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const TableCell = forwardRef<HTMLDivElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("flex items-center", className)} ref={ref} {...props}>
        {children}
      </div>
    );
  },
);

TableCell.displayName = "TableCell";
