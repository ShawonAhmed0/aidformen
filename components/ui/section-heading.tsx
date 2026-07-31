import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Small uppercase kicker above the title. Set in the ochre accent. */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing action, e.g. a "view all" link. Sits inline on wide screens. */
  action?: React.ReactNode;
  align?: "start" | "center";
  /** Inverts colours for use on the brand-toned section. */
  onDark?: boolean;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/**
 * The recurring section header: eyebrow, title, accent rule, description.
 *
 * The 6px ochre rule under the title is the one repeated brand mark on the
 * page — it replaces the assorted `h-1.5 w-24 bg-secondary` bars that were
 * rendering white-on-white.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  onDark = false,
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 sm:mb-14",
        action && !centered && "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
        {eyebrow && (
          <p
            className={cn(
              "text-2xs font-semibold uppercase",
              onDark ? "text-brand-200" : "text-ochre-700"
            )}
          >
            {eyebrow}
          </p>
        )}

        <Heading
          className={cn(
            "text-3xl sm:text-4xl",
            eyebrow && "mt-3",
            onDark ? "text-white" : "text-brand-800"
          )}
        >
          {title}
        </Heading>

        <div
          aria-hidden="true"
          className={cn(
            "mt-5 h-1 w-16 rounded-full",
            centered && "mx-auto",
            onDark ? "bg-brand-300" : "bg-ochre-600"
          )}
        />

        {description && (
          <p
            className={cn(
              "mt-5 text-lg",
              onDark ? "text-brand-100" : "text-ink-600"
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div className={cn("shrink-0", centered && "mx-auto")}>{action}</div>}
    </div>
  );
}
