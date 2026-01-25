import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        new: "border-transparent bg-[var(--status-new-bg)] text-[var(--status-new)]",
        contacted: "border-transparent bg-[var(--status-contacted-bg)] text-[var(--status-contacted)]",
        qualified: "border-transparent bg-[var(--status-qualified-bg)] text-[var(--status-qualified)]",
        proposal: "border-transparent bg-[var(--status-proposal-bg)] text-[var(--status-proposal)]",
        negotiation: "border-transparent bg-[var(--status-negotiation-bg)] text-[var(--status-negotiation)]",
        won: "border-transparent bg-[var(--status-won-bg)] text-[var(--status-won)]",
        lost: "border-transparent bg-[var(--status-lost-bg)] text-[var(--status-lost)]",
        hot: "border-transparent bg-[var(--priority-hot-bg)] text-[var(--priority-hot)]",
        warm: "border-transparent bg-[var(--priority-warm-bg)] text-[var(--priority-warm)]",
        cold: "border-transparent bg-[var(--priority-cold-bg)] text-[var(--priority-cold)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
