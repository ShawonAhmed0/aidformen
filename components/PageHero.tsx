import { Container } from "./ui/container";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  /** Optional mark above the title, e.g. the foundation logo. */
  media?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Interior-page header.
 *
 * The about, contact and team pages each had their own near-identical centred
 * hero with slightly different gradients, paddings and heading sizes. This is
 * that pattern, once.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  media,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-ink-200 bg-brand-50/60",
        className
      )}
    >
      {/* Soft wash so the band settles into the page instead of ending abruptly. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"
      />

      <Container className="relative py-16 text-center sm:py-20 lg:py-24">
        {media && <div className="mb-7 flex justify-center">{media}</div>}

        {eyebrow && (
          <p className="text-2xs font-semibold uppercase text-ochre-700">
            {eyebrow}
          </p>
        )}

        <h1
          className={cn(
            "text-4xl text-brand-800 sm:text-5xl",
            eyebrow && "mt-3"
          )}
        >
          {title}
        </h1>

        {description && (
          <div className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">
            {description}
          </div>
        )}

        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
