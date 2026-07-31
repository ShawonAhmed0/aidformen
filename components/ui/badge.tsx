import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap [&_svg]:size-[1.05em] [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        brand: "bg-brand-50 text-brand-800",
        accent: "bg-ochre-50 text-ochre-800",
        neutral: "bg-ink-100 text-ink-700",
        danger: "bg-danger-soft text-danger",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        /** Solid fill, for placing over photography. */
        solid: "bg-ochre-700 text-white",
        onDark: "bg-white/15 text-white backdrop-blur-sm",
      },
      size: {
        sm: "px-2.5 py-1 text-2xs",
        md: "px-3 py-1.5 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

export function Badge({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props} />
  );
}

export { badgeVariants };
