import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

/**
 * Base Table component - Container for table structure
 * Use composition with Table.Header, Table.Body, Table.Row, and Table.Cell
 */
const TableComponent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("w-full", className)} ref={ref} {...props} />
));

TableComponent.displayName = "Table";

/**
 * Table Header - Container for header rows
 */
const TableHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn("border-b border-border-primary bg-bg-elevated", className)}
      ref={ref}
      {...props}
    />
  ),
);

TableHeader.displayName = "Table.Header";

/**
 * Table Body - Container for body rows
 */
const TableBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn("", className)} ref={ref} {...props} />
  ),
);

TableBody.displayName = "Table.Body";

/**
 * Table Row - Individual row container
 * Accepts children (typically Table.Cell components)
 */
const TableRow = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => {
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
});

TableRow.displayName = "Table.Row";

/**
 * Table Cell - Individual cell within a row
 * Use inside Table.Row
 */
const TableCell = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  return (
    <div className={cn("flex items-center", className)} ref={ref} {...props}>
      {children}
    </div>
  );
});

TableCell.displayName = "Table.Cell";

/**
 * Compound Table component with composition sub-components
 * Usage:
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Cell>Column 1</Table.Cell>
 *       <Table.Cell>Column 2</Table.Cell>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Data 1</Table.Cell>
 *       <Table.Cell>Data 2</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 *
 * Legacy: Still exported as standalone components for backward compatibility
 */
export const Table = Object.assign(TableComponent, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
});

// Export individual components for backward compatibility
export { TableRow as TableRowLegacy, TableCell as TableCellLegacy };
