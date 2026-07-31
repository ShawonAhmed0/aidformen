import Link from "next/link";
import { Megaphone } from "lucide-react";

import { pick, type Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/lib/types/content";
import { Container } from "./ui/container";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";

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
    const ctaHref = settings.announcement_cta_href?.trim();
    const href = ctaHref?.startsWith("/") ? `/${locale}${ctaHref}` : ctaHref;

    return (
        // Pulled up to overlap the hero, which ties the two together instead of
        // leaving the hero as a detached banner.
        <section className="relative z-20 -mt-12 sm:-mt-14">
            <Container>
                <div className="flex flex-col gap-6 rounded-2xl border border-ink-200 bg-surface p-6 shadow-lg sm:p-8 lg:flex-row lg:items-center lg:gap-8">
                    <div className="flex-1">
                        {badge && (
                            <Badge tone="danger" size="md">
                                <Megaphone aria-hidden="true" />
                                {badge}
                            </Badge>
                        )}

                        <h2 className="mt-4 text-xl text-brand-800 sm:text-2xl">
                            {title}
                        </h2>

                        {body && <p className="mt-2 text-base text-ink-600">{body}</p>}
                    </div>

                    {ctaLabel && href && (
                        <Link
                            href={href}
                            className={buttonVariants({ className: "shrink-0" })}
                        >
                            {ctaLabel}
                        </Link>
                    )}
                </div>
            </Container>
        </section>
    );
}
