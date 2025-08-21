import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'modern'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "flex min-h-[120px] w-full rounded-lg border-2 border-neutral-200 bg-background px-4 py-3 text-sm font-mulish font-medium transition-all placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      modern: "flex min-h-[140px] w-full rounded-lg border-2 border-neutral-200 bg-background px-5 py-4 text-base font-mulish font-medium transition-all placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/10 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
    }
    
    return (
      <textarea
        className={cn(variants[variant], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
