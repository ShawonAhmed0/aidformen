import { cn } from "@/lib/utils";

type ContainerProps = React.ComponentProps<"div"> & {
  /**
   * `prose`   long-form reading measure, ~65 characters
   * `default` standard page content
   * `wide`    full-bleed grids and dashboards
   */
  width?: "prose" | "default" | "wide";
};

const widths = {
  prose: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

/**
 * The single source of truth for page gutters and content width.
 *
 * Gutters step up with the viewport rather than staying at a fixed 24px, so
 * text does not run to the edge on tablets and large phones in landscape.
 */
export function Container({
  className,
  width = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        widths[width],
        className
      )}
      {...props}
    />
  );
}
