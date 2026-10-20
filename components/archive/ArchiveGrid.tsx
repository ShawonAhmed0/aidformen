"use client";

import type { ArchiveItem } from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { ArchiveCard } from "./ArchiveCard";
import { cn } from "@/lib/utils";

/**
 * A grid of links to stable, server-rendered entry URLs. This keeps each press
 * kit shareable, printable and readable when JavaScript is disabled.
 */
export function ArchiveGrid({
    items,
    t,
    locale,
    priorityFirst = false,
    className = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
}: {
    items: ArchiveItem[];
    t: ArchiveLabels;
    locale: "bn" | "en";
    priorityFirst?: boolean;
    className?: string;
}) {
    return (
        <ul className={cn(className)}>
            {items.map((item, index) => (
                <li key={item.id} data-print-keep>
                    <ArchiveCard
                        item={item}
                        t={t}
                        locale={locale}
                        priority={priorityFirst && index === 0}
                    />
                </li>
            ))}
        </ul>
    );
}
