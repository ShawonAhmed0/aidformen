"use client";

import { useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { createForumComment, deleteForumComment } from "@/lib/actions/forum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ViewerStatus } from "@/lib/content/forum";
import type { ForumComment } from "@/lib/types/forum";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

type Shared = {
    postId: string;
    t: Dictionary;
    locale: Locale;
    viewer: ViewerStatus;
};

function formatWhen(iso: string, locale: Locale) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

/** Composer used both for top-level comments and for replies. */
function CommentForm({
    postId,
    parentId,
    t,
    placeholder,
    onDone,
    autoFocus = false,
}: {
    postId: string;
    parentId?: string;
    t: Dictionary;
    placeholder: string;
    onDone?: () => void;
    autoFocus?: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [body, setBody] = useState("");

    const submit = () => {
        if (!body.trim()) return;

        const form = new FormData();
        form.append("post_id", postId);
        form.append("body", body);
        if (parentId) form.append("parent_id", parentId);

        startTransition(async () => {
            const result = await createForumComment(form);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            setBody("");
            onDone?.();
            router.refresh();
        });
    };

    return (
        <div className="space-y-2">
            <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                rows={3}
                autoFocus={autoFocus}
                className="resize-y"
            />
            <div className="flex justify-end">
                <Button
                    type="button"
                    size="sm"
                    onClick={submit}
                    disabled={pending || !body.trim()}
                >
                    {pending ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                        <Send aria-hidden="true" />
                    )}
                    {parentId ? t.forum.reply : t.forum.commentCta}
                </Button>
            </div>
        </div>
    );
}

function CommentNode({
    comment,
    depth,
    shared,
}: {
    comment: ForumComment;
    depth: number;
    shared: Shared;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [replying, setReplying] = useState(false);
    const { t, locale, viewer, postId } = shared;

    const canDelete =
        viewer.isAdmin ||
        (viewer.userId !== null && viewer.userId === comment.author_id);

    const remove = () => {
        if (!window.confirm(t.forum.deleteConfirm)) return;

        const form = new FormData();
        form.append("id", comment.id);

        startTransition(async () => {
            const result = await deleteForumComment(form);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            router.refresh();
        });
    };

    return (
        <li>
            <div className="flex items-start gap-3">
                <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                    {comment.author?.avatar_url ? (
                        <Image
                            src={comment.author.avatar_url}
                            alt=""
                            fill
                            unoptimized
                            sizes="32px"
                            className="object-cover"
                        />
                    ) : (
                        <User className="size-4 text-brand-600" aria-hidden="true" />
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-surface-sunken px-4 py-2.5">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-sm font-medium text-ink-900">
                                {comment.author?.full_name || t.forum.anonymous}
                            </span>
                            <time
                                dateTime={comment.created_at}
                                className="text-xs text-ink-500"
                            >
                                {formatWhen(comment.created_at, locale)}
                            </time>
                        </div>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">
                            {comment.is_removed ? t.forum.removedComment : comment.body}
                        </p>
                    </div>

                    <div className="mt-1 flex items-center gap-1">
                        {/* Replies are capped at one level: deeper nesting turns
                            unreadable on a phone, so a reply to a reply joins
                            the same thread. */}
                        {viewer.canParticipate && depth === 0 && (
                            <button
                                type="button"
                                onClick={() => setReplying((v) => !v)}
                                className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink-500 transition-ui hover:bg-ink-100 hover:text-brand-800"
                            >
                                <MessageSquare className="size-3.5" aria-hidden="true" />
                                {t.forum.reply}
                            </button>
                        )}

                        {canDelete && (
                            <button
                                type="button"
                                onClick={remove}
                                disabled={pending}
                                className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink-500 transition-ui hover:bg-danger-soft hover:text-danger"
                            >
                                {pending ? (
                                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Trash2 className="size-3.5" aria-hidden="true" />
                                )}
                                {t.forum.deleteComment}
                            </button>
                        )}
                    </div>

                    {replying && (
                        <div className="mt-2">
                            <CommentForm
                                postId={postId}
                                parentId={comment.id}
                                t={t}
                                placeholder={t.forum.replyPlaceholder}
                                autoFocus
                                onDone={() => setReplying(false)}
                            />
                        </div>
                    )}

                    {comment.replies.length > 0 && (
                        <ul className="mt-3 space-y-3 border-l-2 border-ink-200 pl-4">
                            {comment.replies.map((reply) => (
                                <CommentNode
                                    key={reply.id}
                                    comment={reply}
                                    depth={depth + 1}
                                    shared={shared}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </li>
    );
}

export function CommentThread({
    comments,
    prompt,
    ...shared
}: Shared & {
    comments: ForumComment[];
    /** Stands in for the composer when the viewer may read but not comment. */
    prompt?: ReactNode;
}) {
    const { t, viewer, postId } = shared;

    return (
        <section className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
            <h2 className="text-base font-semibold text-ink-900">
                {t.forum.comments}
                {comments.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-ink-500 tabular-nums">
                        {comments.length}
                    </span>
                )}
            </h2>

            {viewer.canParticipate ? (
                <div className="mt-4">
                    <CommentForm
                        postId={postId}
                        t={t}
                        placeholder={t.forum.commentPlaceholder}
                    />
                </div>
            ) : (
                prompt && <div className="mt-4">{prompt}</div>
            )}

            {comments.length === 0 ? (
                <p className="mt-5 text-sm text-ink-500">{t.forum.noComments}</p>
            ) : (
                <ul className="mt-6 space-y-5">
                    {comments.map((comment) => (
                        <CommentNode
                            key={comment.id}
                            comment={comment}
                            depth={0}
                            shared={shared}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
