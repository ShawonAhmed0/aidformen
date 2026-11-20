"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { updateHeroContent } from "@/lib/actions/hero";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BilingualField } from "./BilingualField";
import { MediaField } from "./MediaField";
import { useAdminLocale } from "./AdminLocale";
import { heroPrimaryLabel } from "@/lib/content/hero-labels";
import type { HeroContent } from "@/lib/types/content";

const s = (v: string | null | undefined) => v ?? "";

const copy = {
    bn: {
        saved: "হিরো সেকশন সংরক্ষণ হয়েছে।",
        textHeading: "লেখা",
        textIntro: "হোমপেজের একদম উপরের অংশে যা দেখা যায়।",
        eyebrowLabel: "ছোট শিরোনাম (eyebrow)",
        eyebrowPlaceholder: "যেমন: আমাদের লক্ষ্য",
        eyebrowHelper: "ঐচ্ছিক। মূল শিরোনামের ঠিক উপরে ছোট করে দেখাবে।",
        titleLabel: "মূল শিরোনাম",
        titlePlaceholder: "হিরো সেকশনের শিরোনাম",
        descriptionLabel: "বিবরণ",
        descriptionPlaceholder: "সংক্ষেপে সংগঠনের পরিচয়",
        buttonsHeading: "বোতাম",
        linkHintBefore: "লিঙ্ক হিসেবে",
        linkHintAfter: "এর মতো ভেতরের ঠিকানা অথবা সম্পূর্ণ URL দিন।",
        primaryLabel: "প্রথম বোতামের লেখা",
        primaryHref: "প্রথম বোতামের লিঙ্ক",
        secondaryLabel: "দ্বিতীয় বোতামের লেখা",
        secondaryHref: "দ্বিতীয় বোতামের লিঙ্ক",
        audioHeading: "হোমপেজ পরিচিতি অডিও",
        audioIntro:
            "হিরোর পরের “আমাদের সম্পর্কে” অংশে দর্শনার্থীরা এই রেকর্ডিংটি শুনতে পারবেন।",
        builtInLead: "এখন সাইটে নিজস্ব দুটি রেকর্ডিং বাজছে —",
        builtInBengali: "বাংলা",
        builtInAnd: "ও",
        builtInEnglish: "ইংরেজি",
        builtInTail: "। এখানে নতুন অডিও আপলোড করলে দুই ভাষার পাতাতেই সেটি বাজবে।",
        audioLabel: "পরিচিতি অডিও",
        audioHelper: "MP3, M4A, OGG বা WAV · সর্বোচ্চ ২৫ MB",
        saving: "সংরক্ষণ হচ্ছে…",
        save: "পরিবর্তন সংরক্ষণ করুন",
    },
    en: {
        saved: "Hero section saved.",
        textHeading: "Text",
        textIntro: "What appears at the very top of the homepage.",
        eyebrowLabel: "Eyebrow (small heading)",
        eyebrowPlaceholder: "e.g. Our mission",
        eyebrowHelper: "Optional. Shown small, just above the main heading.",
        titleLabel: "Main heading",
        titlePlaceholder: "Hero section heading",
        descriptionLabel: "Description",
        descriptionPlaceholder: "A short introduction to the organisation",
        buttonsHeading: "Buttons",
        linkHintBefore: "For a link, enter an internal path like",
        linkHintAfter: "or a full URL.",
        primaryLabel: "First button text",
        primaryHref: "First button link",
        secondaryLabel: "Second button text",
        secondaryHref: "Second button link",
        audioHeading: "Homepage introduction audio",
        audioIntro:
            "Visitors can listen to this recording in the “About us” section just after the hero.",
        builtInLead: "The site is currently playing its two built-in recordings —",
        builtInBengali: "Bengali",
        builtInAnd: "and",
        builtInEnglish: "English",
        builtInTail: ". Uploading new audio here plays it on both language versions.",
        audioLabel: "Introduction audio",
        audioHelper: "MP3, M4A, OGG or WAV · up to 25 MB",
        saving: "Saving…",
        save: "Save changes",
    },
};

export function HeroEditor({ hero }: { hero: HeroContent | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const t = copy[useAdminLocale()];

    const [form, setForm] = useState({
        about_audio_url: s(hero?.about_audio_url),
        title: s(hero?.title),
        title_en: s(hero?.title_en),
        description: s(hero?.description),
        description_en: s(hero?.description_en),
        eyebrow: s(hero?.eyebrow),
        eyebrow_en: s(hero?.eyebrow_en),
        // What the homepage shows, not the raw row: an old "About us" label
        // is displayed as "Our Journey", and the form must not disagree.
        primary_cta_label: heroPrimaryLabel(hero?.primary_cta_label, "bn"),
        primary_cta_label_en: hero?.primary_cta_label_en?.trim()
            ? heroPrimaryLabel(hero.primary_cta_label_en, "en")
            : "",
        primary_cta_href: s(hero?.primary_cta_href),
        secondary_cta_label: s(hero?.secondary_cta_label),
        secondary_cta_label_en: s(hero?.secondary_cta_label_en),
        secondary_cta_href: s(hero?.secondary_cta_href),
    });

    const set = (key: keyof typeof form) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const body = new FormData();
        if (hero?.id) body.append("id", hero.id);
        for (const [key, value] of Object.entries(form)) body.append(key, value);

        startTransition(async () => {
            const result = await updateHeroContent(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(t.saved);
            router.refresh();
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <h2 className="text-base font-semibold text-ink-900">{t.textHeading}</h2>
                <p className="mt-1 text-sm text-ink-500">
                    {t.textIntro}
                </p>

                <div className="mt-6 space-y-5">
                    <BilingualField
                        label={t.eyebrowLabel}
                        value={form.eyebrow}
                        onChange={set("eyebrow")}
                        valueEn={form.eyebrow_en}
                        onChangeEn={set("eyebrow_en")}
                        placeholder={t.eyebrowPlaceholder}
                        helper={t.eyebrowHelper}
                    />

                    <BilingualField
                        label={t.titleLabel}
                        required
                        value={form.title}
                        onChange={set("title")}
                        valueEn={form.title_en}
                        onChangeEn={set("title_en")}
                        placeholder={t.titlePlaceholder}
                    />

                    <BilingualField
                        label={t.descriptionLabel}
                        multiline
                        rows={4}
                        value={form.description}
                        onChange={set("description")}
                        valueEn={form.description_en}
                        onChangeEn={set("description_en")}
                        placeholder={t.descriptionPlaceholder}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <h2 className="text-base font-semibold text-ink-900">{t.buttonsHeading}</h2>
                <p className="mt-1 text-sm text-ink-500">
                    {t.linkHintBefore} <code className="text-xs">/about</code>{" "}
                    {t.linkHintAfter}
                </p>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="space-y-5">
                        <BilingualField
                            label={t.primaryLabel}
                            value={form.primary_cta_label}
                            onChange={set("primary_cta_label")}
                            valueEn={form.primary_cta_label_en}
                            onChangeEn={set("primary_cta_label_en")}
                        />

                        <Field label={t.primaryHref}>
                            {(props) => (
                                <Input
                                    {...props}
                                    value={form.primary_cta_href}
                                    onChange={(e) =>
                                        set("primary_cta_href")(e.target.value)
                                    }
                                    placeholder="/about"
                                />
                            )}
                        </Field>
                    </div>

                    <div className="space-y-5">
                        <BilingualField
                            label={t.secondaryLabel}
                            value={form.secondary_cta_label}
                            onChange={set("secondary_cta_label")}
                            valueEn={form.secondary_cta_label_en}
                            onChangeEn={set("secondary_cta_label_en")}
                        />

                        <Field label={t.secondaryHref}>
                            {(props) => (
                                <Input
                                    {...props}
                                    value={form.secondary_cta_href}
                                    onChange={(e) =>
                                        set("secondary_cta_href")(e.target.value)
                                    }
                                    placeholder="/contact"
                                />
                            )}
                        </Field>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <h2 className="text-base font-semibold text-ink-900">
                    {t.audioHeading}
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                    {t.audioIntro}
                </p>
                {/* The field below is empty by default, yet the homepage plays
                    audio: the two built-in recordings. Say so, or an editor
                    reasonably concludes the player is unlinked. */}
                {!form.about_audio_url && (
                    <p className="mt-3 rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-600">
                        {t.builtInLead}{" "}
                        <a
                            href="/audio/about-bn.mp3"
                            target="_blank"
                            className="font-medium text-brand-700 underline underline-offset-2"
                        >
                            {t.builtInBengali}
                        </a>{" "}
                        {t.builtInAnd}{" "}
                        <a
                            href="/audio/about-en.mp3"
                            target="_blank"
                            className="font-medium text-brand-700 underline underline-offset-2"
                        >
                            {t.builtInEnglish}
                        </a>
                        {t.builtInTail}
                    </p>
                )}

                <MediaField
                    accept="audio"
                    folder="audio"
                    label={t.audioLabel}
                    helper={t.audioHelper}
                    className="mt-6"
                    value={form.about_audio_url || null}
                    onChange={(url) =>
                        setForm((prev) => ({
                            ...prev,
                            about_audio_url: url ?? "",
                        }))
                    }
                />
            </div>

            {/* Sticky so the save control stays reachable on a long form. */}
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
