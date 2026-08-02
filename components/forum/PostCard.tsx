import Image from "next/image";
import Link from "next/link";
import { MessageSquare, User } from "lucide-react";

import { PostMedia } from "./PostMedia";
import { ReactionBar } from "./ReactionBar";
import { DeletePostButton } from "./DeletePostButton";
import { participationNotice } from "./ForumGate";
import type { ViewerStatus } from "@/lib/content/forum";
import type { ForumPost } from "@/lib/types/forum";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

function formatWhen(iso: string, locale: Locale) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

type PostCardProps = {
    post: ForumPost;
    locale: Locale;
    t: Dictionary;
    viewer: ViewerStatus;
    /** Detail view renders the body in full and drops the "open" affordance. */
    detail?: boolean;
};

export function PostCard({
    post,
    locale,
    t,
    viewer,
    detail = false,
}: PostCardProps) {
    const author = post.author;
    const canDelete =
        viewer.isAdmin ||
        (viewer.userId !== null && viewer.userId === post.author_id);

    return (
        <article className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
            <header className="flex items-start gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                    {author?.avatar_url ? (
                        <Image
                            src={author.avatar_url}
                            alt=""
                            fill
                            unoptimized
                            sizes="40px"
                            className="object-cover"
                        />
                    ) : (
                        <User className="size-5 text-brand-600" aria-hidden="true" />
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                        {author?.full_name || t.forum.anonymous}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                        <time dateTime={post.created_at}>
                            {formatWhen(post.created_at, locale)}
                        </time>
                    </p>
                </div>

                {canDelete && <DeletePostButton postId={post.id} t={t} locale={locale} />}
            </header>

            <h2 className="mt-4 text-lg text-brand-800 sm:text-xl">
                {detail ? (
                    post.title
                ) : (
                    <Link
                        href={`/${locale}/forum/${post.id}`}
                        className="rounded transition-ui hover:text-brand-900 hover:underline"
                    >
                        {post.title}
                    </Link>
                )}
            </h2>

            {post.body && (
                <p
                    className={
                        detail
                            ? "mt-2 whitespace-pre-wrap text-base text-ink-700"
                            : "mt-2 line-clamp-4 whitespace-pre-wrap text-base text-ink-700"
                    }
                >
                    {post.body}
                </p>
            )}

            <PostMedia media={post.media} />

            <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4">
                <ReactionBar
                    postId={post.id}
                    reactions={post.reactions}
                    myReaction={post.myReaction}
                    canParticipate={viewer.canParticipate}
                    reactLabel={t.forum.react}
                    blockedMessage={participationNotice(viewer, t)}
                    loginHref={viewer.userId ? null : `/${locale}/login`}
                    loginLabel={t.forum.loginCta}
                />

                {!detail && (
                    <Link
                        href={`/${locale}/forum/${post.id}`}
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-600 transition-ui hover:bg-ink-100 hover:text-brand-800"
                    >
                        <MessageSquare className="size-4" aria-hidden="true" />
                        <span className="tabular-nums">{post.commentCount}</span>
                        <span>{t.forum.comments}</span>
                    </Link>
                )}
            </footer>
        </article>
    );
}
