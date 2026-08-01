import { getChatbotSettings } from "@/lib/content/chatbot";
import { ChatbotEditor } from "@/components/admin/ChatbotEditor";

export default async function AdminChatbotPage() {
    const settings = await getChatbotSettings();

    // Only whether the key exists crosses to the client, never its value.
    const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">চ্যাটবট</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    ওয়েবসাইটের নিচে বাঁ পাশে দেখানো সহায়ক। এটি শুধু আপনার লেখা
                    ব্রিফের ভিত্তিতে উত্তর দেয়।
                </p>
            </div>

            <ChatbotEditor settings={settings} hasApiKey={hasApiKey} />
        </div>
    );
}
