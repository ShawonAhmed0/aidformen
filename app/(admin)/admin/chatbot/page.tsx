import { getChatHistory, getChatbotSettings } from "@/lib/content/chatbot";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { ChatHistory } from "@/components/admin/ChatHistory";
import { ChatbotEditor } from "@/components/admin/ChatbotEditor";

const copy = {
    bn: {
        title: "চ্যাটবট",
        intro:
            "ওয়েবসাইটের সহায়ক, কথোপকথনের নিরাপদ হিস্ট্রি এবং সংরক্ষণ নীতি এখান থেকে পরিচালনা করুন।",
    },
    en: {
        title: "Chatbot",
        intro:
            "Manage the website assistant, the secure conversation history and the retention policy from here.",
    },
};

export default async function AdminChatbotPage() {
    const [settings, conversations, locale] = await Promise.all([
        getChatbotSettings(),
        getChatHistory(),
        getAdminLocale(),
    ]);
    const t = copy[locale];

    // Only whether the key exists crosses to the client, never its value.
    const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">{t.title}</h1>
                <p className="mt-1.5 text-sm text-ink-500">{t.intro}</p>
            </div>

            <ChatHistory conversations={conversations} />
            <ChatbotEditor settings={settings} hasApiKey={hasApiKey} />
        </div>
    );
}
