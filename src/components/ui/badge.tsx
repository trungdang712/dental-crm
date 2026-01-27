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
        outline: "text-foreground border-border",
        // Status variants
        new: "border-transparent bg-status-new-bg text-status-new",
        contacted: "border-transparent bg-status-contacted-bg text-status-contacted",
        qualified: "border-transparent bg-status-qualified-bg text-status-qualified",
        quoted: "border-transparent bg-status-quoted-bg text-status-quoted",
        proposal: "border-transparent bg-status-quoted-bg text-status-quoted",
        negotiating: "border-transparent bg-status-negotiating-bg text-status-negotiating",
        negotiation: "border-transparent bg-status-negotiating-bg text-status-negotiating",
        won: "border-transparent bg-status-won-bg text-status-won",
        lost: "border-transparent bg-status-lost-bg text-status-lost",
        // Priority variants
        hot: "border-transparent bg-priority-hot-bg text-priority-hot",
        warm: "border-transparent bg-priority-warm-bg text-priority-warm",
        cold: "border-transparent bg-priority-cold-bg text-priority-cold",
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
