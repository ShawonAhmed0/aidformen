import { getChatHistory, getChatbotSettings } from "@/lib/content/chatbot";
import { ChatHistory } from "@/components/admin/ChatHistory";
import { ChatbotEditor } from "@/components/admin/ChatbotEditor";

export default async function AdminChatbotPage() {
    const [settings, conversations] = await Promise.all([
        getChatbotSettings(),
        getChatHistory(),
    ]);

    // Only whether the key exists crosses to the client, never its value.
    const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">চ্যাটবট</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    ওয়েবসাইটের সহায়ক, কথোপকথনের নিরাপদ হিস্ট্রি এবং সংরক্ষণ নীতি
                    এখান থেকে পরিচালনা করুন।
                </p>
            </div>

            <ChatHistory conversations={conversations} />
            <ChatbotEditor settings={settings} hasApiKey={hasApiKey} />
        </div>
    );
}
