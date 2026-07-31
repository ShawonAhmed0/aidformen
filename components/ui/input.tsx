import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Text input.
 *
 * 44px tall and 17px text: the height meets the minimum touch target, and the
 * font size stays at or above 16px so iOS Safari does not zoom the viewport on
 * focus. Focus styling comes from the site-wide `:focus-visible` outline.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3.5 text-base text-foreground",
        "transition-ui outline-none",
        "placeholder:text-ink-400",
        "hover:border-ink-400",
        "focus:border-brand-600",
        "file:mr-3 file:inline-flex file:h-7 file:items-center file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:text-sm file:font-medium file:text-ink-700",
        "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:opacity-60",
        "aria-invalid:border-danger aria-invalid:hover:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Input }
