import Link from "next/link";
import { Clock, LogIn, ShieldX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { ViewerStatus } from "@/lib/content/forum";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

/**
 * Explains *why* the forum is unavailable.
 *
 * Row level security returns an empty result set to anyone who is not an
 * approved member, which is indistinguishable from "no posts yet". This turns
 * that silence into a state the visitor can act on: log in, wait for approval,
 * or get in touch.
 *
 * Returns null when the viewer may participate, so callers can render it
 * unconditionally above the feed.
 */
export function ForumGate({
    viewer,
    t,
    locale,
}: {
    viewer: ViewerStatus;
    t: Dictionary;
    locale: Locale;
}) {
    if (viewer.canParticipate) return null;

    const shell =
        "rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-14 text-center";

    if (!viewer.userId) {
        return (
            <div className={shell}>
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <LogIn className="size-7" aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-2xl text-brand-800">{t.forum.loginRequired}</h2>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href={`/${locale}/login`} className={buttonVariants()}>
                        {t.forum.loginCta}
                    </Link>
                    <Link
                        href={`/${locale}/register`}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        {t.auth.registerCta}
                    </Link>
                </div>
            </div>
        );
    }

    if (viewer.status === "rejected") {
        return (
            <div className={shell}>
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                    <ShieldX className="size-7" aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-2xl text-brand-800">{t.forum.rejectedTitle}</h2>
                <p className="mx-auto mt-3 max-w-md text-base text-ink-600">
                    {t.forum.rejectedBody}
                </p>
                <div className="mt-8 flex justify-center">
                    <Link
                        href={`/${locale}/contact`}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        {t.nav.contact}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={shell}>
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
                <Clock className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl text-brand-800">{t.forum.pendingTitle}</h2>
            <p className="mx-auto mt-3 max-w-md text-base text-ink-600">
                {t.forum.pendingBody}
            </p>
        </div>
    );
}
