import { getAllTeamMembers } from "@/lib/content/queries";
import { TeamManager } from "@/components/admin/TeamManager";

export default async function AdminTeamPage() {
    const members = await getAllTeamMembers();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">আমাদের দল</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    সদস্য যোগ করুন, তথ্য সম্পাদনা করুন এবং পাতায় তাঁদের ক্রম ঠিক করুন।
                </p>
            </div>

            <TeamManager members={members} />
        </div>
    );
}
