import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border transition-ui",
  {
    variants: {
      tone: {
        default: "border-ink-200 bg-surface",
        sunken: "border-ink-200 bg-surface-sunken",
        brand: "border-transparent bg-brand-800 text-brand-50",
        outline: "border-ink-200 bg-transparent",
      },
      elevation: {
        flat: "",
        xs: "shadow-xs",
        sm: "shadow-sm",
        md: "shadow-md",
      },
      /** Lift on hover. Only for cards that are themselves a link or button. */
      interactive: {
        true: "hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md",
        false: "",
      },
      padded: {
        none: "",
        sm: "p-5",
        md: "p-6",
        lg: "p-7 sm:p-8",
      },
    },
    defaultVariants: {
      tone: "default",
      elevation: "xs",
      interactive: false,
      padded: "md",
    },
  }
);

export function Card({
  className,
  tone,
  elevation,
  interactive,
  padded,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(
        cardVariants({ tone, elevation, interactive, padded }),
        className
      )}
      {...props}
    />
  );
}

export { cardVariants };
