import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ArchiveManager } from "@/components/admin/ArchiveManager";
import { getAllArchiveEntries } from "@/lib/content/archive";
import {
    archiveSectionPath,
    sectionForContentType,
    type ArchiveSection,
} from "@/lib/types/archive";

const copy: Record<ArchiveSection, { title: string; description: string }> = {
    press_media: {
        title: "মিডিয়া সেন্টার",
        description:
            "নিউজ ও ইভেন্ট, প্রেস রিলিজ এবং মিডিয়া কভারেজ — সাইটের “Media Center” পাতায় যা দেখা যায়, সব এখান থেকে যোগ ও সম্পাদনা করুন।",
    },
    news_archive: {
        title: "গবেষণা ও কেস স্টাডি",
        description:
            "কেস স্টাডি এবং পরিসংখ্যান ও গবেষণা প্রতিবেদন — সাইটের “Research & Case Studies” পাতায় যা দেখা যায়, সব এখান থেকে যোগ ও সম্পাদনা করুন।",
    },
};

/**
 * One admin page per public section. Both public pages are fed by the same
 * archive_entries table, split by content type, so each admin page shows the
 * same slice its public page does.
 */
export async function ArchiveSectionAdmin({ section }: { section: ArchiveSection }) {
    const entries = (await getAllArchiveEntries()).filter(
        (entry) => sectionForContentType[entry.content_type] === section
    );
    const publicPath = `/bn/${archiveSectionPath(section)}`;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl tracking-tight text-ink-900">{copy[section].title}</h1>
                    <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
                        {copy[section].description}
                    </p>
                </div>
                <Link
                    href={publicPath}
                    target="_blank"
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-ink-200 bg-surface px-3 text-sm font-medium text-ink-700 transition-ui hover:border-ink-300 hover:text-brand-800"
                >
                    সাইটে দেখুন
                    <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
            </div>

            <ArchiveManager entries={entries} section={section} />
        </div>
    );
}
