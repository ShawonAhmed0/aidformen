"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { translateToEnglish } from "@/lib/actions/translate";
import { cn } from "@/lib/utils";
import { useAdminLocale } from "./AdminLocale";

const copy = {
    bn: {
        translate: "AI দিয়ে অনুবাদ",
        retranslate: "আবার অনুবাদ",
        confirm: "ইংরেজি বদলাবেন?",
        working: "অনুবাদ হচ্ছে…",
        done: "ইংরেজি অনুবাদ যোগ হয়েছে — একবার দেখে নিন।",
        hint: "বাংলা লেখাটি Claude দিয়ে ইংরেজিতে অনুবাদ করুন",
        failed: "অনুবাদ করা যায়নি। সংযোগ দেখে আবার চেষ্টা করুন।",
    },
    en: {
        translate: "Translate with AI",
        retranslate: "Re-translate",
        confirm: "Replace English?",
        working: "Translating…",
        done: "English translation added — give it a quick read.",
        hint: "Translate the Bengali text into English with Claude",
        failed: "Couldn't translate. Check the connection and try again.",
    },
};

/**
 * Fills a field's English side from its Bengali side.
 *
 * Shown beside the বাংলা / English tabs. When English already has text the
 * button asks once before overwriting it — an editor's own translation should
 * not vanish on a stray click.
 */
export function TranslateButton({
    source,
    target,
    onTranslated,
    className,
}: {
    /** The Bengali value. Nothing to translate when blank. */
    source: string;
    /** The current English value, to know whether this would overwrite. */
    target: string;
    onTranslated: (english: string) => void;
    className?: string;
}) {
    const t = copy[useAdminLocale()];
    const [pending, startTransition] = useTransition();
    const [armed, setArmed] = useState(false);

    // An armed "Replace English?" quietly disarms if not confirmed.
    useEffect(() => {
        if (!armed) return;
        const timer = window.setTimeout(() => setArmed(false), 4000);
        return () => window.clearTimeout(timer);
    }, [armed]);

    const hasSource = source.replace(/<[^>]*>/g, "").trim().length > 0;
    if (!hasSource) return null;

    const overwriting = target.replace(/<[^>]*>/g, "").trim().length > 0;

    const run = () => {
        if (overwriting && !armed) {
            setArmed(true);
            return;
        }
        setArmed(false);

        startTransition(async () => {
            const result = await translateToEnglish({ text: source }).catch(() => null);
            if (!result?.ok) {
                toast.error(result ? result.error : t.failed);
                return;
            }
            const english = result.data?.text ?? "";
            if (!english) return;
            onTranslated(english);
            toast.success(t.done);
        });
    };

    return (
        <button
            type="button"
            onClick={run}
            disabled={pending}
            title={t.hint}
            className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-ui disabled:opacity-60",
                armed
                    ? "bg-warning-soft text-warning-strong"
                    : "text-brand-700 hover:bg-brand-50 hover:text-brand-800",
                className
            )}
        >
            {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
                <Sparkles className="size-3.5" aria-hidden="true" />
            )}
            {pending ? t.working : armed ? t.confirm : overwriting ? t.retranslate : t.translate}
        </button>
    );
}
