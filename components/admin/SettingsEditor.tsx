"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { updateSiteSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BilingualField } from "./BilingualField";
import type { SiteSettings } from "@/lib/types/content";

const s = (v: string | null | undefined) => v ?? "";

/** One card per group, so a long settings form still scans as sections. */
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

export function SettingsEditor({ settings }: { settings: SiteSettings | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [form, setForm] = useState({
        organisation_name: s(settings?.organisation_name),
        organisation_name_en: s(settings?.organisation_name_en),
        tagline: s(settings?.tagline),
        tagline_en: s(settings?.tagline_en),

        emergency_phone: s(settings?.emergency_phone),
        contact_phone: s(settings?.contact_phone),
        contact_email: s(settings?.contact_email),
        address: s(settings?.address),
        address_en: s(settings?.address_en),
        office_hours: s(settings?.office_hours),
        office_hours_en: s(settings?.office_hours_en),

        facebook_url: s(settings?.facebook_url),
        youtube_url: s(settings?.youtube_url),
        website_url: s(settings?.website_url),

        announcement_badge: s(settings?.announcement_badge),
        announcement_badge_en: s(settings?.announcement_badge_en),
        announcement_title: s(settings?.announcement_title),
        announcement_title_en: s(settings?.announcement_title_en),
        announcement_body: s(settings?.announcement_body),
        announcement_body_en: s(settings?.announcement_body_en),
        announcement_cta_label: s(settings?.announcement_cta_label),
        announcement_cta_label_en: s(settings?.announcement_cta_label_en),
        announcement_cta_href: s(settings?.announcement_cta_href),
    });

    const [announcementEnabled, setAnnouncementEnabled] = useState(
        settings?.announcement_enabled ?? false
    );

    const set = (key: keyof typeof form) => (value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!form.organisation_name.trim()) {
            toast.error("সংগঠনের নাম প্রয়োজন।");
            return;
        }

        const body = new FormData();
        for (const [key, value] of Object.entries(form)) body.append(key, value);
        body.append("announcement_enabled", String(announcementEnabled));

        startTransition(async () => {
            const result = await updateSiteSettings(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success("সাইট সেটিংস সংরক্ষণ হয়েছে।");
            router.refresh();
        });
    };

    /** Plain single-language text input — phones, emails and URLs need no translation. */
    const text = (
        key: keyof typeof form,
        label: string,
        options: { placeholder?: string; helper?: string; type?: string } = {}
    ) => (
        <Field label={label} helper={options.helper}>
            {(props) => (
                <Input
                    {...props}
                    type={options.type ?? "text"}
                    value={form[key]}
                    onChange={(e) => set(key)(e.target.value)}
                    placeholder={options.placeholder}
                />
            )}
        </Field>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Panel
                title="সংগঠনের পরিচয়"
                description="নেভিগেশন বার ও ফুটারে যে নাম ও পরিচিতি দেখা যায়।"
            >
                <BilingualField
                    label="সংগঠনের নাম"
                    required
                    value={form.organisation_name}
                    onChange={set("organisation_name")}
                    valueEn={form.organisation_name_en}
                    onChangeEn={set("organisation_name_en")}
                />

                <BilingualField
                    label="সংক্ষিপ্ত পরিচিতি"
                    multiline
                    rows={3}
                    value={form.tagline}
                    onChange={set("tagline")}
                    valueEn={form.tagline_en}
                    onChangeEn={set("tagline_en")}
                    helper="ফুটারে নামের নিচে দেখাবে।"
                />
            </Panel>

            <Panel
                title="যোগাযোগ"
                description="যোগাযোগ পাতা, ফুটার ও জরুরি বোতামে এই তথ্যগুলো ব্যবহার হয়।"
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    {text("emergency_phone", "জরুরি ফোন নম্বর", {
                        type: "tel",
                        placeholder: "01404555999",
                        helper: "নেভিগেশন বারের জরুরি বোতামে ব্যবহার হয়।",
                    })}

                    {text("contact_phone", "সাধারণ ফোন নম্বর", {
                        type: "tel",
                        placeholder: "01404555999",
                    })}
                </div>

                {text("contact_email", "ইমেইল ঠিকানা", {
                    type: "email",
                    placeholder: "info@aidformen.com",
                })}

                <BilingualField
                    label="ঠিকানা"
                    multiline
                    rows={2}
                    value={form.address}
                    onChange={set("address")}
                    valueEn={form.address_en}
                    onChangeEn={set("address_en")}
                />

                <BilingualField
                    label="অফিস সময়"
                    value={form.office_hours}
                    onChange={set("office_hours")}
                    valueEn={form.office_hours_en}
                    onChangeEn={set("office_hours_en")}
                    placeholder="শনিবার – বৃহস্পতিবার, সকাল ৯:০০ – সন্ধ্যা ৬:০০"
                />
            </Panel>

            <Panel
                title="সোশ্যাল ও ওয়েবসাইট"
                description="সম্পূর্ণ ঠিকানা দিন (https:// সহ)। খালি রাখলে ফুটারে আইকনটি দেখাবে না।"
            >
                <div className="grid gap-5 lg:grid-cols-3">
                    {text("facebook_url", "ফেসবুক", {
                        type: "url",
                        placeholder: "https://facebook.com/…",
                    })}
                    {text("youtube_url", "ইউটিউব", {
                        type: "url",
                        placeholder: "https://youtube.com/@…",
                    })}
                    {text("website_url", "ওয়েবসাইট", {
                        type: "url",
                        placeholder: "https://aidformen.com",
                    })}
                </div>
            </Panel>

            <Panel
                title="ঘোষণা"
                description="হোমপেজে হিরো সেকশনের ঠিক নিচে দেখানো বার্তা।"
            >
                <label className="flex items-center gap-2.5 text-sm text-ink-700">
                    <input
                        type="checkbox"
                        checked={announcementEnabled}
                        onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                        className="size-4 rounded border-ink-300 accent-brand-800"
                    />
                    হোমপেজে ঘোষণাটি দেখান
                </label>

                {/* Kept mounted but dimmed when off, so switching it back on does
                    not look like the content was lost. */}
                <div
                    className={
                        announcementEnabled
                            ? "space-y-5"
                            : "space-y-5 opacity-60 transition-ui"
                    }
                >
                    <BilingualField
                        label="ব্যাজের লেখা"
                        value={form.announcement_badge}
                        onChange={set("announcement_badge")}
                        valueEn={form.announcement_badge_en}
                        onChangeEn={set("announcement_badge_en")}
                        placeholder="জরুরি আপডেট"
                    />

                    <BilingualField
                        label="ঘোষণার শিরোনাম"
                        value={form.announcement_title}
                        onChange={set("announcement_title")}
                        valueEn={form.announcement_title_en}
                        onChangeEn={set("announcement_title_en")}
                        helper="শিরোনাম খালি থাকলে ঘোষণাটি দেখানো হবে না।"
                    />

                    <BilingualField
                        label="ঘোষণার বিবরণ"
                        multiline
                        rows={3}
                        value={form.announcement_body}
                        onChange={set("announcement_body")}
                        valueEn={form.announcement_body_en}
                        onChangeEn={set("announcement_body_en")}
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <BilingualField
                            label="বোতামের লেখা"
                            value={form.announcement_cta_label}
                            onChange={set("announcement_cta_label")}
                            valueEn={form.announcement_cta_label_en}
                            onChangeEn={set("announcement_cta_label_en")}
                        />

                        {text("announcement_cta_href", "বোতামের লিঙ্ক", {
                            placeholder: "/register",
                            helper: "ভেতরের ঠিকানা '/' দিয়ে শুরু করুন।",
                        })}
                    </div>
                </div>
            </Panel>

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
