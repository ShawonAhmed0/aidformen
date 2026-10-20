import { getAllArchiveEntries } from "@/lib/content/archive";
import { ArchiveManager } from "@/components/admin/ArchiveManager";

export default async function AdminArchivePage() {
    const entries = await getAllArchiveEntries();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">নিউজ ও মিডিয়া সেন্টার</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    ইভেন্ট, প্রেস রিলিজ, সাংবাদিকদের মিডিয়া কিট, বাহ্যিক সংবাদ,
                    কেস স্টাডি এবং ছবি, ভিডিও ও অডিও এক জায়গা থেকে পরিচালনা করুন।
                </p>
            </div>

            <ArchiveManager entries={entries} />
        </div>
    );
}
