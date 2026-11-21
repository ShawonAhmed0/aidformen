"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { reviewChatCase } from "@/lib/actions/chatbot";
import { Button } from "@/components/ui/button";
import { useAdminLocale } from "./AdminLocale";

const copy = {
    bn: {
        genuine: "আসল হিসেবে চিহ্নিত করুন",
        suspicious: "সন্দেহজনক হিসেবে চিহ্নিত করুন",
        reset: "AI-এর সিদ্ধান্তে ফিরুন",
        failed: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।",
    },
    en: {
        genuine: "Mark as genuine",
        suspicious: "Mark as suspicious",
        reset: "Go back to the AI's verdict",
        failed: "Couldn't save. Please try again.",
    },
};

/**
 * Overrides Claude's fake-or-genuine flag for one chat. The verdict decides
 * whether the chat counts in the feed's figures.
 */
export function CaseReviewButton({
    id,
    flagged,
    overridden,
}: {
    id: string;
    flagged: boolean;
    /** An admin has already decided, so the AI flag is not in force. */
    overridden: boolean;
}) {
    const t = copy[useAdminLocale()];
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const save = (verdict: boolean | null) =>
        startTransition(async () => {
            const result = await reviewChatCase(id, verdict).catch(() => null);
            if (!result?.ok) {
                toast.error(result ? result.error : t.failed);
                return;
            }
            router.refresh();
        });

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => save(!flagged)}
            >
                {pending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                ) : flagged ? (
                    <ShieldCheck aria-hidden="true" />
                ) : (
                    <ShieldAlert aria-hidden="true" />
                )}
                {flagged ? t.genuine : t.suspicious}
            </Button>
            {overridden && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => save(null)}
                >
                    <RotateCcw aria-hidden="true" />
                    {t.reset}
                </Button>
            )}
        </div>
    );
}
