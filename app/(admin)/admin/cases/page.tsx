import { CASES_SHOWN, CaseFeed } from "@/components/admin/CaseFeed";
import { getChatMessages } from "@/lib/content/chatbot";
import { filterCases, getChatCases, parseCaseFilters } from "@/lib/content/chat-cases";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCasesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
    const filters = parseCaseFilters(params);
    const result = await getChatCases(filters);

    // Transcripts only for the chats on show, not the whole range.
    const shown = result.ok ? filterCases(result.cases, filters).slice(0, CASES_SHOWN) : [];
    const messages = await getChatMessages(
        await createClient(),
        shown.map((c) => c.id)
    );

    return (
        <CaseFeed
            filters={filters}
            result={result}
            transcripts={Object.fromEntries(messages)}
            locale={locale}
        />
    );
}
