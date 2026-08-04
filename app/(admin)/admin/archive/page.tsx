import { getAllArchiveEntries } from "@/lib/content/archive";
import { ArchiveManager } from "@/components/admin/ArchiveManager";

export default async function AdminArchivePage() {
    const entries = await getAllArchiveEntries();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">আর্কাইভ</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    ছবির আর্কাইভ ও ভিডিও আর্কাইভ — প্রতিটিতে শিরোনাম, বিবরণ এবং মিডিয়া।
                    দর্শক ধরন, বিভাগ ও সাল অনুযায়ী ফিল্টার করতে পারেন।
                </p>
            </div>

            <ArchiveManager entries={entries} />
        </div>
    );
}
