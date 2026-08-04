"use client";

import { useCallback, useRef, useState } from "react";

import type { ArchiveItem } from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { ArchiveCard } from "./ArchiveCard";
import { ArchiveDialog } from "./ArchiveDialog";
import { cn } from "@/lib/utils";

/**
 * A grid of archive cards and the dialog they open.
 *
 * Shared by the archive page and the homepage preview so both open the same
 * detail view — the preview linking somewhere else would mean two ways of
 * reading the same entry.
 */
export function ArchiveGrid({
    items,
    t,
    locale,
    className = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
}: {
    items: ArchiveItem[];
    t: ArchiveLabels;
    locale: "bn" | "en";
    className?: string;
}) {
    const [selected, setSelected] = useState<ArchiveItem | null>(null);
    // Remembers which card opened the dialog so focus can return there on close.
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const close = useCallback(() => {
        setSelected(null);
        triggerRef.current?.focus();
    }, []);

    return (
        <>
            <ul className={cn(className)}>
                {items.map((item) => (
                    <li key={item.id}>
                        <ArchiveCard
                            item={item}
                            t={t}
                            locale={locale}
                            onOpen={(event) => {
                                triggerRef.current = event.currentTarget;
                                setSelected(item);
                            }}
                        />
                    </li>
                ))}
            </ul>

            {selected && (
                <ArchiveDialog
                    // Keyed by entry so switching entries resets the gallery to
                    // its first photo instead of keeping the previous index.
                    key={selected.id}
                    item={selected}
                    t={t}
                    locale={locale}
                    onClose={close}
                />
            )}
        </>
    );
}
