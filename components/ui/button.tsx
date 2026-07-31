import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * One button system for the whole site.
 *
 * Export `buttonVariants` and spread it onto a `next/link` when you need a
 * navigational button — that keeps anchors as anchors while still sharing
 * every visual token.
 *
 * Focus is deliberately not styled here: globals.css applies a single
 * `:focus-visible` outline site-wide, so buttons cannot drift out of sync
 * with links, inputs and cards.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-lg border border-transparent bg-clip-padding",
    "font-medium whitespace-nowrap select-none",
    "transition-ui",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-[1.15em]",
  ],
  {
    variants: {
      variant: {
        /** Default action. Brand teal. */
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-brand-700 active:bg-brand-900",
        /** Reserved for the single highest-intent CTA on a view. */
        accent:
          "bg-ochre-700 text-white shadow-xs hover:bg-ochre-600 active:bg-ochre-800",
        /** Secondary action beside a primary one. */
        outline:
          "border-ink-300 bg-surface text-ink-800 shadow-xs hover:border-ink-400 hover:bg-ink-50 active:bg-ink-100",
        /** Tertiary / low emphasis. */
        ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
        /** Quiet brand-tinted fill, e.g. filter chips. */
        subtle:
          "bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200",
        /** For placing on brand / photographic backgrounds. */
        onDark:
          "bg-white text-brand-800 shadow-sm hover:bg-brand-50 active:bg-brand-100",
        outlineOnDark:
          "border-white/35 text-white hover:border-white/60 hover:bg-white/10 active:bg-white/20",
        /** Destructive. */
        danger:
          "bg-danger text-white shadow-xs hover:bg-danger-strong active:bg-danger-strong",
        link: "text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline",
      },
      size: {
        /** 36px — dense contexts only (admin toolbars, table rows). */
        sm: "h-9 px-3 text-sm",
        /** 44px — the default, and the platform minimum touch target. */
        md: "h-11 px-5 text-base",
        /** 52px — hero and primary page CTAs. */
        lg: "h-13 px-7 text-lg",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
