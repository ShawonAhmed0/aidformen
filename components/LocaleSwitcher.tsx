"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

import { locales, localeLabels, switchLocalePath, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Language switch.
 *
 * Rendered as real links rather than a button, so each language is
 * right-clickable, middle-clickable and crawlable. The cookie is written on
 * click so the preference survives to the next visit, but the href alone is
 * enough to switch — it works with JavaScript disabled.
 */
export function LocaleSwitcher({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg bg-ink-100 p-0.5",
        className
      )}
      role="group"
      aria-label={label}
    >
      <Languages
        className="ml-2 mr-0.5 size-4 shrink-0 text-ink-500"
        aria-hidden="true"
      />

      {locales.map((code) => {
        const active = code === locale;

        return (
          <Link
            key={code}
            href={switchLocalePath(pathname, code)}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={cn(
              "flex h-8 items-center rounded-md px-2.5 text-sm font-medium transition-ui",
              active
                ? "bg-surface text-ink-900 shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            )}
          >
            {code === "en" ? "EN" : localeLabels[code]}
          </Link>
        );
      })}
    </div>
  );
}
