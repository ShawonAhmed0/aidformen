"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, User, X } from "lucide-react";
import { toast } from "sonner";

import { setMemberStatus } from "@/lib/actions/forum";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MemberProfile, MemberStatus } from "@/lib/types/forum";
import { cn } from "@/lib/utils";

const tabs: { key: MemberStatus | "all"; label: string }[] = [
    { key: "pending", label: "অনুমোদনের অপেক্ষায়" },
    { key: "approved", label: "অনুমোদিত" },
    { key: "rejected", label: "প্রত্যাখ্যাত" },
    { key: "all", label: "সবাই" },
];

const statusBadge: Record<MemberStatus, { tone: "warning" | "success" | "danger"; label: string }> = {
    pending: { tone: "warning", label: "অপেক্ষমাণ" },
    approved: { tone: "success", label: "অনুমোদিত" },
    rejected: { tone: "danger", label: "প্রত্যাখ্যাত" },
};

export function MembersManager({ members }: { members: MemberProfile[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [tab, setTab] = useState<MemberStatus | "all">("pending");

    const counts = members.reduce<Record<string, number>>((acc, m) => {
        acc[m.status] = (acc[m.status] ?? 0) + 1;
        return acc;
    }, {});

    const visible =
        tab === "all" ? members : members.filter((m) => m.status === tab);

    const update = (member: MemberProfile, status: MemberStatus) => {
        const body = new FormData();
        body.append("id", member.id);
        body.append("status", status);

        startTransition(async () => {
            const result = await setMemberStatus(body);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success(
                status === "approved"
                    ? `${member.full_name ?? "সদস্য"} অনুমোদিত হয়েছেন।`
                    : "সদস্যের অবস্থা পরিবর্তন হয়েছে।"
            );
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
                {tabs.map(({ key, label }) => {
                    const active = tab === key;
                    const count = key === "all" ? members.length : counts[key] ?? 0;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            aria-pressed={active}
                            className={cn(
                                "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-ui",
                                active
                                    ? "bg-brand-50 text-brand-800"
                                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                            )}
                        >
                            {label}
                            <span
                                className={cn(
                                    "rounded-full px-1.5 text-2xs",
                                    active ? "bg-brand-100 text-brand-800" : "bg-ink-100 text-ink-600"
                                )}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {visible.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-ink-700">
                        {tab === "pending"
                            ? "অনুমোদনের অপেক্ষায় কেউ নেই।"
                            : "এই তালিকায় কেউ নেই।"}
                    </p>
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {visible.map((member) => (
                        <li
                            key={member.id}
                            className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 p-3"
                        >
                            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                                {member.avatar_url ? (
                                    <Image
                                        src={member.avatar_url}
                                        alt=""
                                        fill
                                        unoptimized
                                        sizes="48px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User className="size-5 text-brand-600" aria-hidden="true" />
                                )}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">
                                    {member.full_name || "নাম দেওয়া হয়নি"}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-ink-500">
                                    {member.phone || "ফোন নম্বর নেই"}
                                </p>

                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    <Badge tone={statusBadge[member.status].tone} size="sm">
                                        {statusBadge[member.status].label}
                                    </Badge>
                                    {member.role === "admin" && (
                                        <Badge tone="brand" size="sm">
                                            <ShieldCheck aria-hidden="true" />
                                            অ্যাডমিন
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {member.status !== "approved" && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={pending}
                                        onClick={() => update(member, "approved")}
                                    >
                                        {pending ? (
                                            <Loader2 className="animate-spin" aria-hidden="true" />
                                        ) : (
                                            <Check aria-hidden="true" />
                                        )}
                                        অনুমোদন করুন
                                    </Button>
                                )}

                                {member.status !== "rejected" && member.role !== "admin" && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={pending}
                                        onClick={() => update(member, "rejected")}
                                    >
                                        <X aria-hidden="true" />
                                        প্রত্যাখ্যান
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
