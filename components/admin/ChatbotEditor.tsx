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
import { useAdminLocale } from "./AdminLocale";
import {
    chatModelConfig,
    chatModels,
    DEFAULT_CHAT_MODEL,
    type ChatbotSettings,
} from "@/lib/types/chatbot";
import { cn } from "@/lib/utils";

const copy = {
    bn: {
        briefRequired: "চ্যাট চালু করার আগে ব্রিফ লিখুন।",
        saved: "চ্যাটবট সেটিংস সংরক্ষণ হয়েছে।",
        keyMissingTitle: "ANTHROPIC_API_KEY সেট করা নেই",
        keyMissingBody: (file: React.ReactNode, key: React.ReactNode) => (
            <>
                সার্ভারে {file} ফাইলে {key} যোগ করুন, তারপর সার্ভার রিস্টার্ট করুন। কী ছাড়া
                চ্যাট উত্তর দিতে পারবে না।
            </>
        ),
        toggleTitle: "চালু / বন্ধ",
        toggleDescription: "ব্রিফ লেখা না থাকলে চ্যাট চালু করা যাবে না।",
        showButton: "ওয়েবসাইটে চ্যাট বোতাম দেখান",
        briefTitle: "ব্রিফ — চ্যাট যা জানে",
        briefDescription:
            "চ্যাট শুধু এখানে লেখা তথ্যের ভিত্তিতেই উত্তর দেবে। যা এখানে নেই, সে বিষয়ে বলবে যে সে জানে না এবং যোগাযোগ করতে বলবে।",
        briefBn: "ব্রিফ (বাংলা)",
        briefBnHelper:
            "সংগঠনের পরিচয়, সেবা, কারা যোগাযোগ করবেন, অফিস সময়, কী কী করা হয় না — যত নির্দিষ্ট, উত্তর তত ভালো।",
        briefPlaceholder:
            "এইড ফর মেন ফাউন্ডেশন কী করে…\n\nসেবা:\n- আইনি পরামর্শের জন্য প্যানেল আইনজীবী\n- …\n\nযোগাযোগ: …\nঅফিস সময়: …",
        briefEn: "ব্রিফ (English)",
        briefEnHelper: "খালি রাখলে ইংরেজি সাইটেও উপরের বাংলা ব্রিফ ব্যবহার হবে।",
        presentationTitle: "উপস্থাপনা",
        presentationDescription: "চ্যাট উইন্ডোতে যা দেখা যাবে।",
        botName: "চ্যাটের নাম",
        greeting: "শুভেচ্ছা বার্তা",
        disclaimer: "দাবিত্যাগ",
        disclaimerHelper: "ইনপুট বক্সের নিচে দেখাবে, এবং চ্যাটকেও এটি মেনে চলতে বলা হয়।",
        technicalTitle: "কারিগরি",
        technicalDescription: "খরচ ও মডেল নিয়ন্ত্রণ।",
        model: "মডেল",
        modelCost: (price: string) =>
            `খরচ: ${price} প্রতি ১০ লক্ষ টোকেন (ইনপুট / আউটপুট)।`,
        modelUnknown: "তালিকার বাইরের মডেল। আইডি সঠিক না হলে চ্যাট উত্তর দিতে পারবে না।",
        modelCustom: "অন্য মডেল (নিজে লিখুন)…",
        modelId: "মডেল আইডি",
        modelIdHelper: "Anthropic-এর ডকুমেন্টেশনে দেওয়া আইডি হুবহু লিখুন।",
        maxTurns: "প্রতি আলোচনায় সর্বোচ্চ প্রশ্ন",
        maxTurnsHelper: "১–৫০। খরচ সীমিত রাখে।",
        retention: "চ্যাট হিস্ট্রি রাখার সময়",
        retentionHelper:
            "৭–৩৬৫০ দিন। নতুন চ্যাট শুরু হলে মেয়াদ পেরোনো হিস্ট্রি স্বয়ংক্রিয়ভাবে মুছে যায়।",
        keepForever: "চ্যাট কখনো মুছবেন না (বার্ষিক রিপোর্টের জন্য প্রয়োজন)",
        days: "দিন",
        saving: "সংরক্ষণ হচ্ছে…",
        save: "পরিবর্তন সংরক্ষণ করুন",
    },
    en: {
        briefRequired: "Write the brief before turning the chat on.",
        saved: "Chatbot settings saved.",
        keyMissingTitle: "ANTHROPIC_API_KEY is not set",
        keyMissingBody: (file: React.ReactNode, key: React.ReactNode) => (
            <>
                Add {key} to the {file} file on the server, then restart the server. Without
                the key the chat cannot answer.
            </>
        ),
        toggleTitle: "On / off",
        toggleDescription: "The chat cannot be turned on until a brief is written.",
        showButton: "Show the chat button on the website",
        briefTitle: "Brief — what the chat knows",
        briefDescription:
            "The chat answers only from what is written here. For anything not covered, it says it does not know and asks the visitor to get in touch.",
        briefBn: "Brief (Bengali)",
        briefBnHelper:
            "Who the organisation is, its services, who should get in touch, office hours, what it does not do — the more specific, the better the answers.",
        briefPlaceholder:
            "What Aid For Men Foundation does…\n\nServices:\n- Panel lawyers for legal advice\n- …\n\nContact: …\nOffice hours: …",
        briefEn: "Brief (English)",
        briefEnHelper: "Leave empty to use the Bengali brief above on the English site too.",
        presentationTitle: "Presentation",
        presentationDescription: "What appears in the chat window.",
        botName: "Chat name",
        greeting: "Greeting message",
        disclaimer: "Disclaimer",
        disclaimerHelper: "Shown below the input box, and the chat is told to follow it too.",
        technicalTitle: "Technical",
        technicalDescription: "Cost and model controls.",
        model: "Model",
        modelCost: (price: string) =>
            `Cost: ${price} per million tokens (input / output).`,
        modelUnknown: "A model outside the list. The chat cannot answer if the id is wrong.",
        modelCustom: "Another model (type your own)…",
        modelId: "Model id",
        modelIdHelper: "Enter the id exactly as given in Anthropic's documentation.",
        maxTurns: "Maximum questions per conversation",
        maxTurnsHelper: "1–50. Keeps the cost bounded.",
        retention: "Chat history retention",
        retentionHelper:
            "7–3650 days. Expired history is deleted automatically when a new chat starts.",
        keepForever: "Never delete chats (needed for yearly reports)",
        days: "days",
        saving: "Saving…",
        save: "Save changes",
    },
};

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
    const locale = useAdminLocale();
    const t = copy[locale];
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
        history_retention_days: String(settings?.history_retention_days ?? 365),
    });
    // Null in the database means chats are never deleted.
    const [keepForever, setKeepForever] = useState(
        settings ? settings.history_retention_days == null : true
    );

    const known = chatModelConfig(form.model);

    const set = (key: keyof typeof form) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (enabled && !form.brief.trim()) {
            toast.error(t.briefRequired);
            return;
        }

        const body = new FormData();
        for (const [key, value] of Object.entries(form)) body.append(key, value);
        body.append("is_enabled", String(enabled));
        body.append("keep_forever", String(keepForever));

        startTransition(async () => {
            const result = await updateChatbotSettings(body);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success(t.saved);
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
                            {t.keyMissingTitle}
                        </p>
                        <p className="mt-1">
                            {t.keyMissingBody(
                                <code className="text-xs">.env.local</code>,
                                <code className="text-xs">ANTHROPIC_API_KEY</code>
                            )}
                        </p>
                    </div>
                </div>
            )}

            <Panel
                title={t.toggleTitle}
                description={t.toggleDescription}
            >
                <label className="flex items-center gap-2.5 text-sm text-ink-700">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="size-4 rounded border-ink-300 accent-brand-800"
                    />
                    {t.showButton}
                </label>
            </Panel>

            <Panel
                title={t.briefTitle}
                description={t.briefDescription}
            >
                <Field
                    label={t.briefBn}
                    required
                    helper={t.briefBnHelper}
                >
                    {(props) => (
                        <Textarea
                            {...props}
                            value={form.brief}
                            onChange={(e) => set("brief")(e.target.value)}
                            rows={12}
                            className="resize-y font-mono text-sm"
                            placeholder={t.briefPlaceholder}
                        />
                    )}
                </Field>

                <Field
                    label={t.briefEn}
                    helper={t.briefEnHelper}
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
                title={t.presentationTitle}
                description={t.presentationDescription}
            >
                <BilingualField
                    label={t.botName}
                    required
                    value={form.bot_name}
                    onChange={set("bot_name")}
                    valueEn={form.bot_name_en}
                    onChangeEn={set("bot_name_en")}
                />

                <BilingualField
                    label={t.greeting}
                    required
                    multiline
                    rows={2}
                    value={form.greeting}
                    onChange={set("greeting")}
                    valueEn={form.greeting_en}
                    onChangeEn={set("greeting_en")}
                />

                <BilingualField
                    label={t.disclaimer}
                    required
                    multiline
                    rows={2}
                    value={form.disclaimer}
                    onChange={set("disclaimer")}
                    valueEn={form.disclaimer_en}
                    onChangeEn={set("disclaimer_en")}
                    helper={t.disclaimerHelper}
                />
            </Panel>

            <Panel
                title={t.technicalTitle}
                description={t.technicalDescription}
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                        label={t.model}
                        helper={known ? t.modelCost(known.price) : t.modelUnknown}
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
                                        {locale === "en" ? m.labelEn : m.label}
                                    </option>
                                ))}
                                <option value={CUSTOM}>{t.modelCustom}</option>
                            </select>
                        )}
                    </Field>

                    {/* Escape hatch: model ids change over time, and a fixed
                        dropdown would otherwise mean waiting on a deploy to use
                        one released after this was written. */}
                    {custom && (
                        <Field
                            label={t.modelId}
                            helper={t.modelIdHelper}
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
                        label={t.maxTurns}
                        helper={t.maxTurnsHelper}
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

                    <Field
                        label={t.retention}
                        helper={t.retentionHelper}
                    >
                        {(props) => (
                            <div className="space-y-2.5">
                                <label className="flex items-center gap-2.5 text-sm text-ink-700">
                                    <input
                                        type="checkbox"
                                        checked={keepForever}
                                        onChange={(e) => setKeepForever(e.target.checked)}
                                        className="size-4 rounded border-ink-300 accent-brand-800"
                                    />
                                    {t.keepForever}
                                </label>
                                <div className="relative">
                                    <Input
                                        {...props}
                                        type="number"
                                        min={7}
                                        max={3650}
                                        disabled={keepForever}
                                        value={form.history_retention_days}
                                        onChange={(e) => set("history_retention_days")(e.target.value)}
                                        className="pr-14"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                                        {t.days}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Field>
                </div>
            </Panel>

            <div className="sticky bottom-4 flex justify-end">
                <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
                    {pending ? (
                        <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            {t.saving}
                        </>
                    ) : (
                        <>
                            <Save aria-hidden="true" />
                            {t.save}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
