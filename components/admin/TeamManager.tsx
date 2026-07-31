"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    User,
    X,
} from "lucide-react";
import { toast } from "sonner";

import {
    createTeamMember,
    deleteTeamMember,
    reorderTeamMembers,
    updateTeamMember,
} from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePicker } from "./ImagePicker";
import { BilingualField } from "./BilingualField";
import type { TeamMember } from "@/lib/types/content";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

type Draft = {
    id: string | null;
    name: string;
    name_en: string;
    role: string;
    role_en: string;
    quote: string;
    quote_en: string;
    statement: string;
    statement_en: string;
    bio: string;
    bio_en: string;
    photo_url: string | null;
    is_published: boolean;
};

const emptyDraft: Draft = {
    id: null,
    name: "",
    name_en: "",
    role: "",
    role_en: "",
    quote: "",
    quote_en: "",
    statement: "",
    statement_en: "",
    bio: "",
    bio_en: "",
    photo_url: null,
    is_published: true,
};

const toDraft = (m: TeamMember): Draft => ({
    id: m.id,
    name: m.name,
    name_en: s(m.name_en),
    role: m.role,
    role_en: s(m.role_en),
    quote: s(m.quote),
    quote_en: s(m.quote_en),
    statement: s(m.statement),
    statement_en: s(m.statement_en),
    bio: s(m.bio),
    bio_en: s(m.bio_en),
    photo_url: m.photo_url,
    is_published: m.is_published,
});

export function TeamManager({ members }: { members: TeamMember[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    const [order, setOrder] = useState(members);
    const [renderedIds, setRenderedIds] = useState(members.map((m) => m.id).join(","));
    const incoming = members.map((m) => m.id).join(",");
    if (renderedIds !== incoming) {
        setRenderedIds(incoming);
        setOrder(members);
    }

    const move = (index: number, direction: -1 | 1) => {
        const next = [...order];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;

        [next[index], next[target]] = [next[target], next[index]];
        setOrder(next);

        const body = new FormData();
        next.forEach((m) => body.append("ids", m.id));

        startTransition(async () => {
            const result = await reorderTeamMembers(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const save = () => {
        if (!draft) return;
        if (!draft.name.trim() || !draft.role.trim()) {
            toast.error("নাম ও পদবি দুটোই প্রয়োজন।");
            return;
        }

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("name", draft.name);
        body.append("name_en", draft.name_en);
        body.append("role", draft.role);
        body.append("role_en", draft.role_en);
        body.append("quote", draft.quote);
        body.append("quote_en", draft.quote_en);
        body.append("statement", draft.statement);
        body.append("statement_en", draft.statement_en);
        body.append("bio", draft.bio);
        body.append("bio_en", draft.bio_en);
        if (draft.photo_url) body.append("photo_url", draft.photo_url);
        body.append("is_published", String(draft.is_published));

        startTransition(async () => {
            const result = draft.id
                ? await updateTeamMember(body)
                : await createTeamMember(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(draft.id ? "সদস্য আপডেট হয়েছে।" : "নতুন সদস্য যোগ হয়েছে।");
            setDraft(null);
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-ink-900">
                        দলের সদস্য
                    </h2>
                    <p className="mt-1 text-sm text-ink-500">
                        “আমাদের দল” পাতায় যে সদস্যরা দেখাবেন, তাঁদের তথ্য ও ক্রম।
                    </p>
                </div>

                <Button
                    type="button"
                    size="sm"
                    onClick={() => setDraft({ ...emptyDraft })}
                    disabled={pending}
                >
                    <Plus aria-hidden="true" />
                    নতুন সদস্য
                </Button>
            </div>

            {order.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-ink-700">
                        এখনো কোনো সদস্য যোগ করা হয়নি।
                    </p>
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {order.map((member, index) => (
                        <li
                            key={member.id}
                            className={cn(
                                "flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 p-3",
                                !member.is_published && "bg-surface-sunken"
                            )}
                        >
                            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                                {member.photo_url ? (
                                    <Image
                                        src={member.photo_url}
                                        alt=""
                                        fill
                                        unoptimized
                                        sizes="56px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User
                                        className="size-6 text-brand-600"
                                        aria-hidden="true"
                                    />
                                )}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">
                                    {member.name}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-brand-700">
                                    {member.role}
                                </p>
                                {!member.is_published && (
                                    <Badge tone="neutral" size="sm" className="mt-1.5">
                                        অপ্রকাশিত
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={pending || index === 0}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                    aria-label="উপরে সরান"
                                >
                                    <ArrowUp className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={pending || index === order.length - 1}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                    aria-label="নিচে সরান"
                                >
                                    <ArrowDown className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDraft(toDraft(member))}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                    aria-label="সম্পাদনা করুন"
                                >
                                    <Pencil className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setConfirmingDelete(member.id)}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                    aria-label="মুছে ফেলুন"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>

                            {confirmingDelete === member.id && (
                                <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-line bg-danger-soft px-4 py-3">
                                    <p className="text-sm text-danger">
                                        “{member.role}” স্থায়ীভাবে মুছে যাবে।
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
                                                body.append("id", member.id);
                                                setConfirmingDelete(null);
                                                startTransition(async () => {
                                                    const r = await deleteTeamMember(body);
                                                    if (!r.ok) toast.error(r.error);
                                                    else toast.success("সদস্য মুছে ফেলা হয়েছে।");
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
                        aria-label={draft.id ? "সদস্য সম্পাদনা" : "নতুন সদস্য"}
                        className="my-8 w-full max-w-xl rounded-2xl bg-surface p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg text-ink-900">
                                {draft.id ? "সদস্য সম্পাদনা" : "নতুন সদস্য"}
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
                            <ImagePicker
                                label="ছবি"
                                folder="team"
                                aspect="square"
                                className="max-w-48"
                                value={draft.photo_url}
                                onChange={(url) =>
                                    setDraft((d) => (d ? { ...d, photo_url: url } : d))
                                }
                            />

                            <BilingualField
                                label="নাম"
                                required
                                value={draft.name}
                                onChange={(v) => setDraft((d) => (d ? { ...d, name: v } : d))}
                                valueEn={draft.name_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, name_en: v } : d))
                                }
                            />

                            <BilingualField
                                label="পদবি"
                                required
                                value={draft.role}
                                onChange={(v) => setDraft((d) => (d ? { ...d, role: v } : d))}
                                valueEn={draft.role_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, role_en: v } : d))
                                }
                            />

                            <BilingualField
                                label="সংক্ষিপ্ত উক্তি"
                                multiline
                                rows={2}
                                value={draft.quote}
                                onChange={(v) => setDraft((d) => (d ? { ...d, quote: v } : d))}
                                valueEn={draft.quote_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, quote_en: v } : d))
                                }
                                helper="কার্ডে দেখানো হবে।"
                            />

                            <BilingualField
                                label="বিবৃতি"
                                multiline
                                rows={3}
                                value={draft.statement}
                                onChange={(v) =>
                                    setDraft((d) => (d ? { ...d, statement: v } : d))
                                }
                                valueEn={draft.statement_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, statement_en: v } : d))
                                }
                                helper="“বিস্তারিত পড়ুন” খুললে বড় করে দেখাবে।"
                            />

                            <BilingualField
                                label="পরিচিতি"
                                multiline
                                rows={4}
                                value={draft.bio}
                                onChange={(v) => setDraft((d) => (d ? { ...d, bio: v } : d))}
                                valueEn={draft.bio_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, bio_en: v } : d))
                                }
                            />

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
