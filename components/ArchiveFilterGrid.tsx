"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type Item = {
    id: string;
    title: string;
    category: string;
    action: string;
    image: string | null;
    href: string;
};

export function ArchiveFilterGrid({
    items,
    categories,
    allLabel,
    filterLabel,
    emptyLabel,
}: {
    items: Item[];
    categories: string[];
    allLabel: string;
    filterLabel: string;
    emptyLabel: string;
}) {
    const [active, setActive] = useState(allLabel);

    const visible =
        active === allLabel ? items : items.filter((i) => i.category === active);

    return (
        <>
            {/* Rendered as a tablist so the active choice is exposed to assistive
                tech, not merely implied by colour. */}
            <div
                role="tablist"
                aria-label={filterLabel}
                className="mb-10 flex flex-wrap justify-center gap-2"
            >
                {categories.map((category) => {
                    const isActive = active === category;

                    return (
                        <button
                            key={category}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActive(category)}
                            className={cn(
                                "min-h-11 rounded-full border px-5 text-sm font-medium transition-ui",
                                isActive
                                    ? "border-brand-800 bg-brand-800 text-white"
                                    : "border-ink-200 bg-surface text-ink-600 hover:border-brand-400 hover:text-brand-800"
                            )}
                        >
                            {category}
                        </button>
                    );
                })}
            </div>

            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
                    <p className="text-base font-medium text-ink-700">{emptyLabel}</p>
                    <button
                        type="button"
                        onClick={() => setActive(allLabel)}
                        className="mt-3 rounded-sm text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                    >
                        {allLabel}
                    </button>
                </div>
            ) : (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {visible.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={item.href}
                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-xs transition-ui hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md"
                            >
                                <div className="relative aspect-3/2 overflow-hidden bg-ink-100">
                                    {item.image && (
                                        <Image
                                            src={item.image}
                                            alt=""
                                            fill
                                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                                            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
                                        />
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <h3 className="text-base text-brand-800">
                                        {item.title}
                                    </h3>

                                    {item.action && (
                                        <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-brand-700">
                                            {item.action}
                                            <ArrowLeft
                                                aria-hidden="true"
                                                className="size-4 rotate-180 transition-transform duration-200 group-hover:translate-x-0.5"
                                            />
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
