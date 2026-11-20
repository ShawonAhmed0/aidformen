import { getSiteSettings } from "@/lib/content/queries";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

const copy = {
    bn: {
        title: "সাইট সেটিংস",
        intro:
            "যোগাযোগের তথ্য, সোশ্যাল লিঙ্ক ও হোমপেজের ঘোষণা — পুরো সাইটে এগুলো এক জায়গা থেকে নিয়ন্ত্রিত হয়।",
    },
    en: {
        title: "Site settings",
        intro:
            "Contact details, social links and the homepage announcement — controlled from one place for the whole site.",
    },
};

export default async function AdminSettingsPage() {
    const [settings, locale] = await Promise.all([getSiteSettings(), getAdminLocale()]);
    const t = copy[locale];

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">{t.title}</h1>
                <p className="mt-1.5 text-sm text-ink-500">{t.intro}</p>
            </div>

            <SettingsEditor settings={settings} />
        </div>
    );
}
