import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-2xl px-3 py-1.5 text-xs font-mulish font-bold tracking-wide transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-lg",
        secondary: "bg-neutral-100 text-neutral-800 border border-neutral-200",
        success: "bg-success-500 text-white shadow-lg",
        warning: "bg-warning-500 text-white shadow-lg", 
        destructive: "bg-red-500 text-white shadow-lg",
        outline: "border-2 border-primary-500 text-primary-500 bg-transparent",
        accent: "bg-primary-100 text-primary-700 border border-primary-200",
        gradient: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg",
      },
      size: {
        default: "px-3 py-1.5 text-xs",
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
