import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, LogIn, ShieldX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewerStatus } from "@/lib/content/forum";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

/**
 * The one-line reason a viewer cannot post, comment or react.
 *
 * Shared with the reaction picker, which says the same thing in a toast when a
 * visitor taps an emoji, so the two never drift apart.
 */
export function participationNotice(viewer: ViewerStatus, t: Dictionary): string {
    if (!viewer.userId) return t.forum.loginRequired;
    if (viewer.status === "rejected") return t.forum.rejectedTitle;
    return t.forum.pendingTitle;
}

function Notice({
    icon,
    iconClass,
    title,
    body,
    children,
}: {
    icon: ReactNode;
    iconClass: string;
    title: string;
    body: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-300 bg-surface px-5 py-5 text-center sm:flex-row sm:text-left">
            <span
                className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    iconClass
                )}
            >
                {icon}
            </span>

            <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-brand-800">{title}</p>
                <p className="mt-1 text-sm text-ink-600">{body}</p>
            </div>

            {children && (
                <div className="flex shrink-0 flex-wrap justify-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}

/**
 * Explains *why* the viewer cannot join in.
 *
 * The forum itself is public, so this sits where the composer or the comment
 * box would be rather than in front of the feed: read on either way, and log
 * in, wait for approval, or get in touch to take part.
 *
 * Returns null when the viewer may participate, so callers can render it
 * unconditionally in that slot.
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

    const title = participationNotice(viewer, t);

    if (!viewer.userId) {
        return (
            <Notice
                icon={<LogIn className="size-5" aria-hidden="true" />}
                iconClass="bg-brand-50 text-brand-700"
                title={title}
                body={t.forum.guestBody}
            >
                <Link
                    href={`/${locale}/login`}
                    className={buttonVariants()}
                >
                    {t.forum.loginCta}
                </Link>
                <Link
                    href={`/${locale}/register`}
                    className={buttonVariants({ variant: "outline" })}
                >
                    {t.auth.registerCta}
                </Link>
            </Notice>
        );
    }

    if (viewer.status === "rejected") {
        return (
            <Notice
                icon={<ShieldX className="size-5" aria-hidden="true" />}
                iconClass="bg-danger-soft text-danger"
                title={title}
                body={t.forum.rejectedBody}
            >
                <Link
                    href={`/${locale}/contact`}
                    className={buttonVariants({ variant: "outline" })}
                >
                    {t.nav.contact}
                </Link>
            </Notice>
        );
    }

    return (
        <Notice
            icon={<Clock className="size-5" aria-hidden="true" />}
            iconClass="bg-warning-soft text-warning"
            title={title}
            body={t.forum.pendingBody}
        />
    );
}
