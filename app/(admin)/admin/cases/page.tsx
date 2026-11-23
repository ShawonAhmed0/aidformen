import { CASES_SHOWN, CaseFeed } from "@/components/admin/CaseFeed";
import { getChatMessages } from "@/lib/content/chatbot";
import { getChatDocuments } from "@/lib/content/chat-documents";
import { filterCases, getChatCases, parseCaseFilters } from "@/lib/content/chat-cases";
import { getRangeSummary } from "@/lib/content/chat-reports";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCasesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
    const filters = parseCaseFilters(params);
    const [result, summary] = await Promise.all([
        getChatCases(filters),
        getRangeSummary(filters.from, filters.to),
    ]);

    // Transcripts only for the chats on show, not the whole range.
    const shown = result.ok ? filterCases(result.cases, filters).slice(0, CASES_SHOWN) : [];
    const ids = shown.map((c) => c.id);
    const [messages, documents] = await Promise.all([
        getChatMessages(await createClient(), ids),
        getChatDocuments(ids),
    ]);

    return (
        <CaseFeed
            filters={filters}
            result={result}
            transcripts={Object.fromEntries(messages)}
            summary={summary}
            documents={documents}
            locale={locale}
        />
    );
}
