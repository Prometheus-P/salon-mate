import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // M3 Button base: rounded-full for pill shape, 150ms transition handled in globals.css
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // M3 Filled Button (primary)
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        // M3 Filled Tonal Button (secondary)
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        // M3 Outlined Button
        outline:
          "border border-primary text-primary bg-transparent hover:bg-primary/10 active:bg-primary/20 dark:border-primary dark:hover:bg-primary/20",
        // M3 Text Button (ghost)
        ghost:
          "text-primary hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary/20",
        // Destructive (error state)
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
        // M3 Tonal Button (softer than filled)
        tonal:
          "bg-primary/15 text-primary hover:bg-primary/25 active:bg-primary/30 dark:bg-primary/20 dark:hover:bg-primary/30",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-12 px-8 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
