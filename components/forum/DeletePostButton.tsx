"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteForumPost } from "@/lib/actions/forum";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

export function DeletePostButton({
    postId,
    t,
    locale,
    redirectAfter = false,
}: {
    postId: string;
    t: Dictionary;
    locale: Locale;
    /** Set on the detail page, where the post being deleted is the whole view. */
    redirectAfter?: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const remove = () => {
        if (!window.confirm(t.forum.deleteConfirm)) return;

        const body = new FormData();
        body.append("id", postId);

        startTransition(async () => {
            const result = await deleteForumPost(body);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            if (redirectAfter) router.push(`/${locale}/forum`);
            else router.refresh();
        });
    };

    return (
        <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={t.forum.deletePost}
            title={t.forum.deletePost}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-ui hover:bg-danger-soft hover:text-danger"
        >
            {pending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Trash2 className="size-4" />
            )}
        </button>
    );
}
