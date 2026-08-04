"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    CalendarDays,
    Eye,
    EyeOff,
    ImageOff,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";

import {
    createActivity,
    deleteActivity,
    reorderActivities,
    toggleActivityPublished,
    updateActivity,
} from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ImagePicker } from "./ImagePicker";
import { BilingualField } from "./BilingualField";
import {
    activityPlacements,
    type Activity,
    type ActivityPlacement,
} from "@/lib/types/content";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

/** Where each placement actually surfaces, so the choice is not a guess. */
const placementInfo: Record<
    ActivityPlacement,
    { label: string; description: string }
> = {
    feature: {
        label: "প্রধান কার্যক্রম",
        description: "হোমপেজের বড় ছবিসহ কার্ড। সাধারণত একটিই রাখুন।",
    },
    advisory: {
        label: "বিশেষ নির্দেশিকা",
        description: "হোমপেজে ছবিহীন, লেখাভিত্তিক নোটিশ কার্ড।",
    },
    secondary: {
        label: "সহায়ক কার্যক্রম",
        description: "হোমপেজে প্রধান কার্ডের পাশে ছোট কার্ড হিসেবে দেখাবে।",
    },
};

type Draft = {
    id: string | null;
    placement: ActivityPlacement;
    title: string;
    title_en: string;
    category: string;
    category_en: string;
    excerpt: string;
    excerpt_en: string;
    location: string;
    location_en: string;
    action_label: string;
    action_label_en: string;
    image_url: string | null;
    event_date: string;
    href: string;
    is_published: boolean;
};

const emptyDraft = (placement: ActivityPlacement): Draft => ({
    id: null,
    placement,
    title: "",
    title_en: "",
    category: "",
    category_en: "",
    excerpt: "",
    excerpt_en: "",
    location: "",
    location_en: "",
    action_label: "",
    action_label_en: "",
    image_url: null,
    event_date: "",
    href: "",
    is_published: true,
});

const toDraft = (a: Activity): Draft => ({
    id: a.id,
    placement: a.placement,
    title: a.title,
    title_en: s(a.title_en),
    category: s(a.category),
    category_en: s(a.category_en),
    excerpt: s(a.excerpt),
    excerpt_en: s(a.excerpt_en),
    location: s(a.location),
    location_en: s(a.location_en),
    action_label: s(a.action_label),
    action_label_en: s(a.action_label_en),
    image_url: a.image_url,
    event_date: s(a.event_date),
    href: s(a.href),
    is_published: a.is_published,
});

export function ActivitiesManager({ activities }: { activities: Activity[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    // Local copy so arrow reordering feels instant; resynced whenever the server
    // sends a different set of rows.
    const [rows, setRows] = useState(activities);
    const [renderedIds, setRenderedIds] = useState(
        activities.map((a) => a.id).join(",")
    );
    const incoming = activities.map((a) => a.id).join(",");
    if (renderedIds !== incoming) {
        setRenderedIds(incoming);
        setRows(activities);
    }

    const grouped = activityPlacements.map((placement) => ({
        placement,
        items: rows.filter((a) => a.placement === placement),
    }));

    const move = (placement: ActivityPlacement, index: number, direction: -1 | 1) => {
        const group = rows.filter((a) => a.placement === placement);
        const target = index + direction;
        if (target < 0 || target >= group.length) return;

        [group[index], group[target]] = [group[target], group[index]];

        // Splice the reordered group back into the full list, keeping the other
        // placements exactly where they were.
        let cursor = 0;
        setRows(rows.map((a) => (a.placement === placement ? group[cursor++] : a)));

        const body = new FormData();
        group.forEach((a) => body.append("ids", a.id));

        startTransition(async () => {
            const result = await reorderActivities(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const togglePublished = (activity: Activity) => {
        const body = new FormData();
        body.append("id", activity.id);
        body.append("is_published", String(!activity.is_published));

        startTransition(async () => {
            const result = await toggleActivityPublished(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const save = () => {
        if (!draft) return;
        if (!draft.title.trim()) {
            toast.error("শিরোনাম প্রয়োজন।");
            return;
        }

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("placement", draft.placement);
        body.append("title", draft.title);
        body.append("title_en", draft.title_en);
        body.append("category", draft.category);
        body.append("category_en", draft.category_en);
        body.append("excerpt", draft.excerpt);
        body.append("excerpt_en", draft.excerpt_en);
        body.append("location", draft.location);
        body.append("location_en", draft.location_en);
        body.append("action_label", draft.action_label);
        body.append("action_label_en", draft.action_label_en);
        if (draft.image_url) body.append("image_url", draft.image_url);
        body.append("event_date", draft.event_date);
        body.append("href", draft.href);
        body.append("is_published", String(draft.is_published));

        startTransition(async () => {
            const result = draft.id
                ? await updateActivity(body)
                : await createActivity(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(draft.id ? "কার্যক্রম আপডেট হয়েছে।" : "নতুন কার্যক্রম যোগ হয়েছে।");
            setDraft(null);
            router.refresh();
        });
    };

    return (
        <div className="space-y-5">
            {grouped.map(({ placement, items }) => (
                <section
                    key={placement}
                    className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-ink-900">
                                {placementInfo[placement].label}
                            </h2>
                            <p className="mt-1 text-sm text-ink-500">
                                {placementInfo[placement].description}
                            </p>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setDraft(emptyDraft(placement))}
                            disabled={pending}
                        >
                            <Plus aria-hidden="true" />
                            যোগ করুন
                        </Button>
                    </div>

                    {items.length === 0 ? (
                        <p className="mt-5 rounded-xl border border-dashed border-ink-300 px-6 py-8 text-center text-sm text-ink-500">
                            এই অংশে এখনো কিছু যোগ করা হয়নি।
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-3">
                            {items.map((activity, index) => (
                                <li
                                    key={activity.id}
                                    className={cn(
                                        "flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 p-3",
                                        !activity.is_published && "bg-surface-sunken"
                                    )}
                                >
                                    <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                                        {activity.image_url ? (
                                            <Image
                                                src={activity.image_url}
                                                alt=""
                                                fill
                                                unoptimized
                                                sizes="80px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <ImageOff
                                                className="size-5 text-brand-600"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-ink-900">
                                            {activity.title}
                                        </p>

                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                                            {activity.category && (
                                                <span className="text-brand-700">
                                                    {activity.category}
                                                </span>
                                            )}
                                            {activity.event_date && (
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {activity.event_date}
                                                </span>
                                            )}
                                            {activity.location && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {activity.location}
                                                </span>
                                            )}
                                        </div>

                                        {!activity.is_published && (
                                            <Badge tone="neutral" size="sm" className="mt-1.5">
                                                অপ্রকাশিত
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => move(placement, index, -1)}
                                            disabled={pending || index === 0}
                                            className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                            aria-label="উপরে সরান"
                                        >
                                            <ArrowUp className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => move(placement, index, 1)}
                                            disabled={pending || index === items.length - 1}
                                            className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                            aria-label="নিচে সরান"
                                        >
                                            <ArrowDown className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => togglePublished(activity)}
                                            disabled={pending}
                                            className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                            aria-label={
                                                activity.is_published
                                                    ? "সাইট থেকে লুকান"
                                                    : "সাইটে দেখান"
                                            }
                                        >
                                            {activity.is_published ? (
                                                <Eye className="size-4" />
                                            ) : (
                                                <EyeOff className="size-4" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDraft(toDraft(activity))}
                                            disabled={pending}
                                            className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                            aria-label="সম্পাদনা করুন"
                                        >
                                            <Pencil className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setConfirmingDelete(activity.id)}
                                            disabled={pending}
                                            className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                            aria-label="মুছে ফেলুন"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    {confirmingDelete === activity.id && (
                                        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-line bg-danger-soft px-4 py-3">
                                            <p className="text-sm text-danger">
                                                “{activity.title}” স্থায়ীভাবে মুছে যাবে।
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setConfirmingDelete(null)}
                                                >
                                                    বাতিল
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={pending}
                                                    onClick={() => {
                                                        const body = new FormData();
                                                        body.append("id", activity.id);
                                                        setConfirmingDelete(null);
                                                        startTransition(async () => {
                                                            const r = await deleteActivity(body);
                                                            if (!r.ok) toast.error(r.error);
                                                            else
                                                                toast.success(
                                                                    "কার্যক্রম মুছে ফেলা হয়েছে।"
                                                                );
                                                            router.refresh();
                                                        });
                                                    }}
                                                >
                                                    মুছে ফেলুন
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}

            {draft && (
                <div
                    className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setDraft(null);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={draft.id ? "কার্যক্রম সম্পাদনা" : "নতুন কার্যক্রম"}
                        className="my-8 w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg text-ink-900">
                                {draft.id ? "কার্যক্রম সম্পাদনা" : "নতুন কার্যক্রম"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setDraft(null)}
                                className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-ui hover:bg-ink-100"
                                aria-label="বন্ধ করুন"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-5">
                            <Field
                                label="কোথায় দেখাবে"
                                helper={placementInfo[draft.placement].description}
                            >
                                {(props) => (
                                    <select
                                        {...props}
                                        value={draft.placement}
                                        onChange={(e) =>
                                            setDraft((d) =>
                                                d
                                                    ? {
                                                          ...d,
                                                          placement: e.target
                                                              .value as ActivityPlacement,
                                                      }
                                                    : d
                                            )
                                        }
                                        className={cn(
                                            "h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground transition-ui outline-none hover:border-ink-400 focus:border-brand-600",
                                            props.className
                                        )}
                                    >
                                        {activityPlacements.map((p) => (
                                            <option key={p} value={p}>
                                                {placementInfo[p].label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </Field>

                            <ImagePicker
                                label="ছবি"
                                folder="activities"
                                value={draft.image_url}
                                onChange={(url) =>
                                    setDraft((d) => (d ? { ...d, image_url: url } : d))
                                }
                            />

                            <BilingualField
                                label="শিরোনাম"
                                required
                                multiline
                                rows={2}
                                value={draft.title}
                                onChange={(v) => setDraft((d) => (d ? { ...d, title: v } : d))}
                                valueEn={draft.title_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, title_en: v } : d))
                                }
                            />

                            <BilingualField
                                label="বিভাগ"
                                value={draft.category}
                                onChange={(v) =>
                                    setDraft((d) => (d ? { ...d, category: v } : d))
                                }
                                valueEn={draft.category_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, category_en: v } : d))
                                }
                                placeholder="যেমন: আইনি সহায়তা"
                                helper="কার্ডে শিরোনামের উপরে ছোট করে দেখাবে।"
                            />

                            <BilingualField
                                label="সংক্ষিপ্ত বিবরণ"
                                multiline
                                rows={3}
                                value={draft.excerpt}
                                onChange={(v) =>
                                    setDraft((d) => (d ? { ...d, excerpt: v } : d))
                                }
                                valueEn={draft.excerpt_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, excerpt_en: v } : d))
                                }
                            />

                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="তারিখ" helper="ঐচ্ছিক।">
                                    {(props) => (
                                        <Input
                                            {...props}
                                            type="date"
                                            value={draft.event_date}
                                            onChange={(e) =>
                                                setDraft((d) =>
                                                    d ? { ...d, event_date: e.target.value } : d
                                                )
                                            }
                                        />
                                    )}
                                </Field>

                                <BilingualField
                                    label="স্থান"
                                    value={draft.location}
                                    onChange={(v) =>
                                        setDraft((d) => (d ? { ...d, location: v } : d))
                                    }
                                    valueEn={draft.location_en}
                                    onChangeEn={(v) =>
                                        setDraft((d) => (d ? { ...d, location_en: v } : d))
                                    }
                                />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <BilingualField
                                    label="বোতামের লেখা"
                                    value={draft.action_label}
                                    onChange={(v) =>
                                        setDraft((d) => (d ? { ...d, action_label: v } : d))
                                    }
                                    valueEn={draft.action_label_en}
                                    onChangeEn={(v) =>
                                        setDraft((d) => (d ? { ...d, action_label_en: v } : d))
                                    }
                                    placeholder="বিস্তারিত পড়ুন"
                                />

                                <Field
                                    label="লিঙ্ক"
                                    helper="ভেতরের ঠিকানা '/' দিয়ে শুরু করুন।"
                                >
                                    {(props) => (
                                        <Input
                                            {...props}
                                            value={draft.href}
                                            onChange={(e) =>
                                                setDraft((d) =>
                                                    d ? { ...d, href: e.target.value } : d
                                                )
                                            }
                                            placeholder="/archive"
                                        />
                                    )}
                                </Field>
                            </div>

                            <label className="flex items-center gap-2.5 text-sm text-ink-700">
                                <input
                                    type="checkbox"
                                    checked={draft.is_published}
                                    onChange={(e) =>
                                        setDraft((d) =>
                                            d ? { ...d, is_published: e.target.checked } : d
                                        )
                                    }
                                    className="size-4 rounded border-ink-300 accent-brand-800"
                                />
                                ওয়েবসাইটে দেখান
                            </label>
                        </div>

                        <div className="mt-7 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDraft(null)}
                            >
                                বাতিল
                            </Button>
                            <Button type="button" onClick={save} disabled={pending}>
                                {pending && (
                                    <Loader2 className="animate-spin" aria-hidden="true" />
                                )}
                                সংরক্ষণ করুন
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
