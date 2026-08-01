"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setForumReaction } from "@/lib/actions/forum";
import {
    reactionKinds,
    reactionMeta,
    type ReactionKind,
} from "@/lib/types/forum";
import { cn } from "@/lib/utils";

type ReactionBarProps = {
    postId: string;
    reactions: Partial<Record<ReactionKind, number>>;
    myReaction: ReactionKind | null;
    canParticipate: boolean;
    reactLabel: string;
};

/**
 * Five-way reaction picker.
 *
 * A member holds at most one reaction per post, so picking a different one
 * replaces it and picking the current one again clears it. Counts update
 * optimistically — waiting for the server round trip made every tap feel
 * broken on a slow connection.
 */
export function ReactionBar({
    postId,
    reactions,
    myReaction,
    canParticipate,
    reactLabel,
}: ReactionBarProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [mine, setMine] = useState<ReactionKind | null>(myReaction);
    const [counts, setCounts] =
        useState<Partial<Record<ReactionKind, number>>>(reactions);

    const choose = (kind: ReactionKind) => {
        if (!canParticipate) return;

        const clearing = mine === kind;
        const previous = mine;

        setCounts((c) => {
            const next = { ...c };
            if (previous) next[previous] = Math.max(0, (next[previous] ?? 1) - 1);
            if (!clearing) next[kind] = (next[kind] ?? 0) + 1;
            return next;
        });
        setMine(clearing ? null : kind);

        const body = new FormData();
        body.append("post_id", postId);
        if (clearing) body.append("clear", "true");
        else body.append("kind", kind);

        startTransition(async () => {
            const result = await setForumReaction(body);
            if (!result.ok) {
                // Put the optimistic change back the way it was.
                setMine(previous);
                setCounts(reactions);
                toast.error(result.error);
                return;
            }
            router.refresh();
        });
    };

    const total = reactionKinds.reduce((sum, k) => sum + (counts[k] ?? 0), 0);

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="sr-only">{reactLabel}</span>

            {reactionKinds.map((kind) => {
                const count = counts[kind] ?? 0;
                const active = mine === kind;
                const { emoji, label } = reactionMeta[kind];

                return (
                    <button
                        key={kind}
                        type="button"
                        onClick={() => choose(kind)}
                        disabled={!canParticipate}
                        aria-pressed={active}
                        aria-label={`${label}${count ? ` (${count})` : ""}`}
                        title={label}
                        className={cn(
                            "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-ui",
                            active
                                ? "border-brand-600 bg-brand-50 font-semibold text-brand-800"
                                : "border-ink-200 text-ink-600 hover:border-ink-400 hover:bg-ink-50",
                            !canParticipate && "cursor-default opacity-60 hover:border-ink-200 hover:bg-transparent"
                        )}
                    >
                        <span aria-hidden="true" className="text-base leading-none">
                            {emoji}
                        </span>
                        {count > 0 && <span className="tabular-nums">{count}</span>}
                    </button>
                );
            })}

            {total > 0 && (
                <span className="ml-1 text-xs text-ink-500 tabular-nums">{total}</span>
            )}
        </div>
    );
}
