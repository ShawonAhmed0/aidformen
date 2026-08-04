import { getAllActivities } from "@/lib/content/queries";
import { ActivitiesManager } from "@/components/admin/ActivitiesManager";

export default async function AdminActivitiesPage() {
    const activities = await getAllActivities();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">কার্যক্রম</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    হোমপেজের কার্ডগুলো — কোথায় দেখাবে তা “কোথায় দেখাবে” অপশন দিয়ে
                    ঠিক করুন। ছবি ও ভিডিওর সংগ্রহ এখন আলাদা “আর্কাইভ” পাতায়।
                </p>
            </div>

            <ActivitiesManager activities={activities} />
        </div>
    );
}
