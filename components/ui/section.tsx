import { cn } from "@/lib/utils";
import { Container } from "./container";

type Tone = "default" | "sunken" | "brand";

type SectionProps = React.ComponentProps<"section"> & {
  /** Background treatment. Alternating tones is what gives the page rhythm. */
  tone?: Tone;
  /** Vertical rhythm step. */
  space?: "sm" | "md" | "lg";
  containerWidth?: React.ComponentProps<typeof Container>["width"];
  /** Opt out of the built-in Container when a section needs to bleed. */
  bare?: boolean;
  containerClassName?: string;
};

const tones: Record<Tone, string> = {
  default: "bg-background text-foreground",
  sunken: "bg-surface-sunken text-foreground",
  brand: "bg-brand-900 text-brand-50",
};

const spaces = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-20 lg:py-24",
  lg: "py-20 sm:py-28 lg:py-32",
} as const;

/**
 * Standard page section: one tone, one vertical rhythm step, one container.
 *
 * Sections were previously each inventing their own `py-20` / `max-w-6xl` /
 * `px-4 sm:px-6 lg:px-8` combination, which is why they read as unrelated
 * blocks rather than one page.
 */
export function Section({
  className,
  containerClassName,
  tone = "default",
  space = "md",
  containerWidth = "default",
  bare = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(tones[tone], spaces[space], className)}
      {...props}
    >
      {bare ? (
        children
      ) : (
        <Container width={containerWidth} className={containerClassName}>
          {children}
        </Container>
      )}
    </section>
  );
}
