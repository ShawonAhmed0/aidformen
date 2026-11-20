import { getAllTeamMembers } from "@/lib/content/queries";
import { TeamManager } from "@/components/admin/TeamManager";
import { getAdminLocale } from "@/lib/i18n/admin-server";

const copy = {
    bn: {
        title: "আমাদের দল",
        intro: "সদস্য যোগ করুন, তথ্য সম্পাদনা করুন এবং পাতায় তাঁদের ক্রম ঠিক করুন।",
    },
    en: {
        title: "Our Team",
        intro: "Add members, edit their details and set their order on the page.",
    },
};

export default async function AdminTeamPage() {
    const [members, locale] = await Promise.all([
        getAllTeamMembers(),
        getAdminLocale(),
    ]);
    const t = copy[locale];

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">{t.title}</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    {t.intro}
                </p>
            </div>

            <TeamManager members={members} />
        </div>
    );
}
