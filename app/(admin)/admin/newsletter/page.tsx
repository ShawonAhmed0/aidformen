import { NewsletterManager } from "@/components/admin/NewsletterManager";
import { getNewsletterSubscribers } from "@/lib/content/queries";

export default async function AdminNewsletterPage() {
    const subscribers = await getNewsletterSubscribers();

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">নিউজলেটার</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    হোমপেজের “আমাদের কার্যক্রমে যুক্ত হতে চান?” ফর্ম থেকে যাঁরা সাবস্ক্রাইব
                    করেছেন। ইমেইল পাঠাতে তালিকাটি কপি বা CSV হিসেবে ডাউনলোড করুন।
                </p>
            </div>

            <NewsletterManager subscribers={subscribers} />
        </div>
    );
}
