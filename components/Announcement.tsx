import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";

import { localizeHref, pick, type Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/lib/types/content";
import { Container } from "./ui/container";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export default function Announcement({
    locale,
    settings,
}: {
    locale: Locale;
    settings: SiteSettings | null;
}) {
    if (!settings?.announcement_enabled) return null;

    const title = pick(
        locale,
        settings.announcement_title,
        settings.announcement_title_en
    );
    if (!title) return null;

    const badge = pick(
        locale,
        settings.announcement_badge,
        settings.announcement_badge_en
    );
    const body = pick(
        locale,
        settings.announcement_body,
        settings.announcement_body_en
    );
    const ctaLabel = pick(
        locale,
        settings.announcement_cta_label,
        settings.announcement_cta_label_en
    );
    const href = settings.announcement_cta_href
        ? localizeHref(locale, settings.announcement_cta_href, "/news")
        : null;

    return (
        // Continues the About section's white band rather than floating on a
        // strip of page background of its own, and reads as a notice: icon,
        // copy, one action.
        <section className="bg-surface pb-10 sm:pb-14">
            <Container>
                <div className="flex flex-col gap-5 rounded-2xl border border-ink-200 bg-surface-sunken p-5 shadow-xs sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                    {/* On phones the icon rides in the badge instead of
                        taking a row of its own above it. */}
                    <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger sm:flex">
                        <Megaphone className="size-6" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                        {badge && (
                            <Badge tone="danger" size="sm">
                                <Megaphone aria-hidden="true" className="sm:hidden" />
                                {badge}
                            </Badge>
                        )}

                        <h2 className={cn("text-lg leading-snug text-brand-900 sm:text-xl", badge && "mt-2")}>
                            {title}
                        </h2>

                        {body && <p className="mt-1 text-sm leading-6 text-ink-600">{body}</p>}
                    </div>

                    {ctaLabel && href && (
                        <Link
                            href={href}
                            className={buttonVariants({ className: "shrink-0 gap-2 self-start sm:self-center" })}
                        >
                            {ctaLabel}
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </Container>
        </section>
    );
}
