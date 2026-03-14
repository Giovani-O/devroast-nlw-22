import { forwardRef, type HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils";

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

const cardHeaderVariants = tv({
  base: "flex flex-col space-y-1.5 pb-4 border-b border-border-primary",
});

const cardTitleVariants = tv({
  base: "text-lg font-semibold leading-none tracking-tight",
});

const cardDescriptionVariants = tv({
  base: "text-sm text-text-secondary",
});

const cardContentVariants = tv({
  base: "pt-4",
});

const cardFooterVariants = tv({
  base: "flex items-center justify-between pt-4 border-t border-border-primary",
});

export type CardVariants = VariantProps<typeof cardVariants>;

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    CardVariants {}

/**
 * Base Card component with support for multiple style variants
 * Use composition with Card.Header, Card.Title, Card.Description, Card.Content, and Card.Footer
 */
const CardComponent = forwardRef<HTMLDivElement, CardProps>(
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

CardComponent.displayName = "Card";

/**
 * Card Header - Container for card header content
 * Typically contains title and description
 */
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn(cardHeaderVariants(), className)} ref={ref} {...props} />
  ),
);

CardHeader.displayName = "Card.Header";

/**
 * Card Title - Main title of the card
 * Should be used inside Card.Header
 */
const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 className={cn(cardTitleVariants(), className)} ref={ref} {...props} />
));

CardTitle.displayName = "Card.Title";

/**
 * Card Description - Supporting description text for the card
 * Should be used inside Card.Header below Card.Title
 */
const CardDescription = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(cardDescriptionVariants(), className)}
    ref={ref}
    {...props}
  />
));

CardDescription.displayName = "Card.Description";

/**
 * Card Content - Main content container of the card
 * Place primary card content here
 */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(cardContentVariants(), className)}
      ref={ref}
      {...props}
    />
  ),
);

CardContent.displayName = "Card.Content";

/**
 * Card Footer - Footer content container
 * Typically contains actions or secondary information
 */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn(cardFooterVariants(), className)} ref={ref} {...props} />
  ),
);

CardFooter.displayName = "Card.Footer";

/**
 * Compound Card component with composition sub-components
 * Usage:
 * <Card variant="default">
 *   <Card.Header>
 *     <Card.Title>Title</Card.Title>
 *     <Card.Description>Description</Card.Description>
 *   </Card.Header>
 *   <Card.Content>
 *     Main content here
 *   </Card.Content>
 *   <Card.Footer>
 *     Footer content here
 *   </Card.Footer>
 * </Card>
 */
export const Card = Object.assign(CardComponent, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});
