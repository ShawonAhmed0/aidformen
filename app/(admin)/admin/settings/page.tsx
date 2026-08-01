import { getSiteSettings } from "@/lib/content/queries";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export default async function AdminSettingsPage() {
    const settings = await getSiteSettings();

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">সাইট সেটিংস</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    যোগাযোগের তথ্য, সোশ্যাল লিঙ্ক ও হোমপেজের ঘোষণা — পুরো সাইটে
                    এগুলো এক জায়গা থেকে নিয়ন্ত্রিত হয়।
                </p>
            </div>

            <SettingsEditor settings={settings} />
        </div>
    );
}
