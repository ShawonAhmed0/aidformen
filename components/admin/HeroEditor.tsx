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
import type { HeroContent } from "@/lib/types/content";

const s = (v: string | null | undefined) => v ?? "";

export function HeroEditor({ hero }: { hero: HeroContent | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [form, setForm] = useState({
        title: s(hero?.title),
        title_en: s(hero?.title_en),
        description: s(hero?.description),
        description_en: s(hero?.description_en),
        eyebrow: s(hero?.eyebrow),
        eyebrow_en: s(hero?.eyebrow_en),
        primary_cta_label: s(hero?.primary_cta_label),
        primary_cta_label_en: s(hero?.primary_cta_label_en),
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

            toast.success("হিরো সেকশন সংরক্ষণ হয়েছে।");
            router.refresh();
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <h2 className="text-base font-semibold text-ink-900">লেখা</h2>
                <p className="mt-1 text-sm text-ink-500">
                    হোমপেজের একদম উপরের অংশে যা দেখা যায়।
                </p>

                <div className="mt-6 space-y-5">
                    <BilingualField
                        label="ছোট শিরোনাম (eyebrow)"
                        value={form.eyebrow}
                        onChange={set("eyebrow")}
                        valueEn={form.eyebrow_en}
                        onChangeEn={set("eyebrow_en")}
                        placeholder="যেমন: আমাদের লক্ষ্য"
                        helper="ঐচ্ছিক। মূল শিরোনামের ঠিক উপরে ছোট করে দেখাবে।"
                    />

                    <BilingualField
                        label="মূল শিরোনাম"
                        required
                        value={form.title}
                        onChange={set("title")}
                        valueEn={form.title_en}
                        onChangeEn={set("title_en")}
                        placeholder="হিরো সেকশনের শিরোনাম"
                    />

                    <BilingualField
                        label="বিবরণ"
                        multiline
                        rows={4}
                        value={form.description}
                        onChange={set("description")}
                        valueEn={form.description_en}
                        onChangeEn={set("description_en")}
                        placeholder="সংক্ষেপে সংগঠনের পরিচয়"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <h2 className="text-base font-semibold text-ink-900">বোতাম</h2>
                <p className="mt-1 text-sm text-ink-500">
                    লিঙ্ক হিসেবে <code className="text-xs">/about</code> এর মতো
                    ভেতরের ঠিকানা অথবা সম্পূর্ণ URL দিন।
                </p>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="space-y-5">
                        <BilingualField
                            label="প্রথম বোতামের লেখা"
                            value={form.primary_cta_label}
                            onChange={set("primary_cta_label")}
                            valueEn={form.primary_cta_label_en}
                            onChangeEn={set("primary_cta_label_en")}
                        />

                        <Field label="প্রথম বোতামের লিঙ্ক">
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
                            label="দ্বিতীয় বোতামের লেখা"
                            value={form.secondary_cta_label}
                            onChange={set("secondary_cta_label")}
                            valueEn={form.secondary_cta_label_en}
                            onChangeEn={set("secondary_cta_label_en")}
                        />

                        <Field label="দ্বিতীয় বোতামের লিঙ্ক">
                            {(props) => (
                                <Input
                                    {...props}
                                    value={form.secondary_cta_href}
                                    onChange={(e) =>
                                        set("secondary_cta_href")(e.target.value)
                                    }
                                    placeholder="/register"
                                />
                            )}
                        </Field>
                    </div>
                </div>
            </div>

            {/* Sticky so the save control stays reachable on a long form. */}
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
