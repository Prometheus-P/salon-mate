import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-status-published-container text-status-published",
        warning: "bg-status-scheduled-container text-status-scheduled",
        error: "bg-status-failed-container text-status-failed",
        pending: "bg-status-pending-container text-status-pending",
        outline: "border border-current bg-transparent",
        // Platform-specific badges
        google: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        naver: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        kakao: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
