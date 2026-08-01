"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { updateChatbotSettings } from "@/lib/actions/chatbot";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BilingualField } from "./BilingualField";
import {
    chatModelConfig,
    chatModels,
    DEFAULT_CHAT_MODEL,
    type ChatbotSettings,
} from "@/lib/types/chatbot";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

/** Sentinel for the "type your own" option — never stored. */
const CUSTOM = "__custom__";

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            <p className="mt-1 text-sm text-ink-500">{description}</p>
            <div className="mt-6 space-y-5">{children}</div>
        </section>
    );
}

export function ChatbotEditor({
    settings,
    hasApiKey,
}: {
    settings: ChatbotSettings | null;
    /** Resolved on the server — the key itself never reaches the browser. */
    hasApiKey: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [enabled, setEnabled] = useState(settings?.is_enabled ?? false);

    // A stored model outside the dropdown opens the free-text field, so an
    // existing choice is never silently rewritten by the select.
    const [custom, setCustom] = useState(
        Boolean(settings?.model) && !chatModelConfig(settings!.model)
    );
    const [form, setForm] = useState({
        bot_name: settings?.bot_name ?? "সহায়ক",
        bot_name_en: s(settings?.bot_name_en),
        greeting: settings?.greeting ?? "",
        greeting_en: s(settings?.greeting_en),
        brief: s(settings?.brief),
        brief_en: s(settings?.brief_en),
        disclaimer: settings?.disclaimer ?? "",
        disclaimer_en: s(settings?.disclaimer_en),
        model: settings?.model ?? DEFAULT_CHAT_MODEL,
        max_turns: String(settings?.max_turns ?? 12),
    });

    const known = chatModelConfig(form.model);

    const set = (key: keyof typeof form) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (enabled && !form.brief.trim()) {
            toast.error("চ্যাট চালু করার আগে ব্রিফ লিখুন।");
            return;
        }

        const body = new FormData();
        for (const [key, value] of Object.entries(form)) body.append(key, value);
        body.append("is_enabled", String(enabled));

        startTransition(async () => {
            const result = await updateChatbotSettings(body);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success("চ্যাটবট সেটিংস সংরক্ষণ হয়েছে।");
            router.refresh();
        });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            {!hasApiKey && (
                <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-warning-line bg-warning-soft p-4"
                >
                    <TriangleAlert
                        className="size-5 shrink-0 text-warning"
                        aria-hidden="true"
                    />
                    <div className="text-sm text-ink-700">
                        <p className="font-semibold text-ink-900">
                            ANTHROPIC_API_KEY সেট করা নেই
                        </p>
                        <p className="mt-1">
                            সার্ভারে <code className="text-xs">.env.local</code> ফাইলে{" "}
                            <code className="text-xs">ANTHROPIC_API_KEY</code> যোগ করুন,
                            তারপর সার্ভার রিস্টার্ট করুন। কী ছাড়া চ্যাট উত্তর দিতে পারবে না।
                        </p>
                    </div>
                </div>
            )}

            <Panel
                title="চালু / বন্ধ"
                description="ব্রিফ লেখা না থাকলে চ্যাট চালু করা যাবে না।"
            >
                <label className="flex items-center gap-2.5 text-sm text-ink-700">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="size-4 rounded border-ink-300 accent-brand-800"
                    />
                    ওয়েবসাইটে চ্যাট বোতাম দেখান
                </label>
            </Panel>

            <Panel
                title="ব্রিফ — চ্যাট যা জানে"
                description="চ্যাট শুধু এখানে লেখা তথ্যের ভিত্তিতেই উত্তর দেবে। যা এখানে নেই, সে বিষয়ে বলবে যে সে জানে না এবং যোগাযোগ করতে বলবে।"
            >
                <Field
                    label="ব্রিফ (বাংলা)"
                    required
                    helper="সংগঠনের পরিচয়, সেবা, কারা যোগাযোগ করবেন, অফিস সময়, কী কী করা হয় না — যত নির্দিষ্ট, উত্তর তত ভালো।"
                >
                    {(props) => (
                        <Textarea
                            {...props}
                            value={form.brief}
                            onChange={(e) => set("brief")(e.target.value)}
                            rows={12}
                            className="resize-y font-mono text-sm"
                            placeholder={
                                "এইড ফর মেন ফাউন্ডেশন কী করে…\n\nসেবা:\n- আইনি পরামর্শের জন্য প্যানেল আইনজীবী\n- …\n\nযোগাযোগ: …\nঅফিস সময়: …"
                            }
                        />
                    )}
                </Field>

                <Field
                    label="ব্রিফ (English)"
                    helper="খালি রাখলে ইংরেজি সাইটেও উপরের বাংলা ব্রিফ ব্যবহার হবে।"
                >
                    {(props) => (
                        <Textarea
                            {...props}
                            value={form.brief_en}
                            onChange={(e) => set("brief_en")(e.target.value)}
                            rows={8}
                            className="resize-y font-mono text-sm"
                        />
                    )}
                </Field>
            </Panel>

            <Panel
                title="উপস্থাপনা"
                description="চ্যাট উইন্ডোতে যা দেখা যাবে।"
            >
                <BilingualField
                    label="চ্যাটের নাম"
                    required
                    value={form.bot_name}
                    onChange={set("bot_name")}
                    valueEn={form.bot_name_en}
                    onChangeEn={set("bot_name_en")}
                />

                <BilingualField
                    label="শুভেচ্ছা বার্তা"
                    required
                    multiline
                    rows={2}
                    value={form.greeting}
                    onChange={set("greeting")}
                    valueEn={form.greeting_en}
                    onChangeEn={set("greeting_en")}
                />

                <BilingualField
                    label="দাবিত্যাগ"
                    required
                    multiline
                    rows={2}
                    value={form.disclaimer}
                    onChange={set("disclaimer")}
                    valueEn={form.disclaimer_en}
                    onChangeEn={set("disclaimer_en")}
                    helper="ইনপুট বক্সের নিচে দেখাবে, এবং চ্যাটকেও এটি মেনে চলতে বলা হয়।"
                />
            </Panel>

            <Panel
                title="কারিগরি"
                description="খরচ ও মডেল নিয়ন্ত্রণ।"
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                        label="মডেল"
                        helper={
                            known
                                ? `খরচ: ${known.price} প্রতি ১০ লক্ষ টোকেন (ইনপুট / আউটপুট)।`
                                : "তালিকার বাইরের মডেল। আইডি সঠিক না হলে চ্যাট উত্তর দিতে পারবে না।"
                        }
                    >
                        {(props) => (
                            <select
                                {...props}
                                value={custom ? CUSTOM : form.model}
                                onChange={(e) => {
                                    if (e.target.value === CUSTOM) {
                                        setCustom(true);
                                        return;
                                    }
                                    setCustom(false);
                                    set("model")(e.target.value);
                                }}
                                className={cn(
                                    "h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground transition-ui outline-none hover:border-ink-400 focus:border-brand-600",
                                    props.className
                                )}
                            >
                                {chatModels.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.label}
                                    </option>
                                ))}
                                <option value={CUSTOM}>অন্য মডেল (নিজে লিখুন)…</option>
                            </select>
                        )}
                    </Field>

                    {/* Escape hatch: model ids change over time, and a fixed
                        dropdown would otherwise mean waiting on a deploy to use
                        one released after this was written. */}
                    {custom && (
                        <Field
                            label="মডেল আইডি"
                            helper="Anthropic-এর ডকুমেন্টেশনে দেওয়া আইডি হুবহু লিখুন।"
                        >
                            {(props) => (
                                <Input
                                    {...props}
                                    value={form.model}
                                    onChange={(e) => set("model")(e.target.value)}
                                    placeholder="claude-sonnet-5"
                                />
                            )}
                        </Field>
                    )}

                    <Field
                        label="প্রতি আলোচনায় সর্বোচ্চ প্রশ্ন"
                        helper="১–৫০। খরচ সীমিত রাখে।"
                    >
                        {(props) => (
                            <Input
                                {...props}
                                type="number"
                                min={1}
                                max={50}
                                value={form.max_turns}
                                onChange={(e) => set("max_turns")(e.target.value)}
                            />
                        )}
                    </Field>
                </div>
            </Panel>

            <div className="sticky bottom-4 flex justify-end">
                <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
                    {pending ? (
                        <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            সংরক্ষণ হচ্ছে…
                        </>
                    ) : (
                        <>
                            <Save aria-hidden="true" />
                            পরিবর্তন সংরক্ষণ করুন
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
