import { getMembers } from "@/lib/content/forum";
import { MembersManager } from "@/components/admin/MembersManager";

export default async function AdminMembersPage() {
    const members = await getMembers();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">সদস্য</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    নতুন নিবন্ধন অনুমোদন করুন। অনুমোদিত সদস্যরাই ফোরামে পোস্ট,
                    মন্তব্য ও রিঅ্যাকশন দিতে পারবেন।
                </p>
            </div>

            <MembersManager members={members} />
        </div>
    );
}
