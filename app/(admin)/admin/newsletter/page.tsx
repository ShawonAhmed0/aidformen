import { NewsletterManager } from "@/components/admin/NewsletterManager";
import { getNewsletterSubscribers } from "@/lib/content/queries";
import { getAdminLocale } from "@/lib/i18n/admin-server";

const copy = {
    bn: {
        title: "নিউজলেটার",
        intro:
            "হোমপেজের “আমাদের কার্যক্রমে যুক্ত হতে চান?” ফর্ম থেকে যাঁরা সাবস্ক্রাইব করেছেন। ইমেইল পাঠাতে তালিকাটি কপি বা CSV হিসেবে ডাউনলোড করুন।",
    },
    en: {
        title: "Newsletter",
        intro:
            "People who subscribed through the homepage “Want to get involved?” form. Copy the list or download it as CSV to send them email.",
    },
};

export default async function AdminNewsletterPage() {
    const [subscribers, locale] = await Promise.all([
        getNewsletterSubscribers(),
        getAdminLocale(),
    ]);
    const t = copy[locale];

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">{t.title}</h1>
                <p className="mt-1.5 text-sm text-ink-500">{t.intro}</p>
            </div>

            <NewsletterManager subscribers={subscribers} />
        </div>
    );
}
