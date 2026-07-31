import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-lg border border-input bg-surface px-3.5 py-3 text-base text-foreground",
        "transition-ui outline-none",
        "placeholder:text-ink-400",
        "hover:border-ink-400",
        "focus:border-brand-600",
        "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:opacity-60",
        "aria-invalid:border-danger aria-invalid:hover:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
