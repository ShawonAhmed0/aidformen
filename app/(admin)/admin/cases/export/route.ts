import { requireAdmin } from "@/lib/actions/shared";
import { filterCases, getChatCases, parseCaseFilters } from "@/lib/content/chat-cases";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { chatCategoryLabel, isFlagged, occupationGroupLabel } from "@/lib/types/chatbot";

const headers = {
  bn: [
    "তারিখ ও সময়",
    "নাম",
    "মোবাইল",
    "সমস্যার ধরন",
    "বয়স",
    "পেশা",
    "পেশার শ্রেণি",
    "সারসংক্ষেপ",
    "সারসংক্ষেপ (ইংরেজি)",
    "বার্তা",
    "যাচাই প্রয়োজন",
    "সন্দেহের কারণ",
    "ভাষা",
  ],
  en: [
    "Date and time",
    "Name",
    "Mobile",
    "Problem type",
    "Age",
    "Occupation",
    "Occupation group",
    "Summary (Bengali)",
    "Summary (English)",
    "Messages",
    "Needs review",
    "Reason for suspicion",
    "Language",
  ],
};

const yes = { bn: "হ্যাঁ", en: "Yes" };
const no = { bn: "না", en: "No" };

/** RFC 4180 quoting. */
function quote(text: string) {
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * A cell from visitor-supplied text. A leading = + - @ would run as a formula
 * when the file is opened in a spreadsheet, so it is neutralised first.
 */
function cell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return quote(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
}

/**
 * The Problem feed as a CSV, with the same filters as the page. Every chat in
 * the range is included, flagged ones marked rather than dropped, so the file
 * can be re-counted however the reader wants.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return new Response(auth.error, { status: 403 });

  const locale = await getAdminLocale();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = parseCaseFilters(params);
  const result = await getChatCases(filters);
  if (!result.ok) {
    return new Response(
      result.reason === "migration"
        ? "Run supabase/migrations/0020_chat_intake.sql first."
        : "Could not load the conversations.",
      { status: 503 }
    );
  }

  // Oldest first, the way a log reads.
  const rows = filterCases(result.cases, filters).reverse();
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const lines = [
    headers[locale].map(cell).join(","),
    ...rows.map((c) =>
      [
        stamp.format(new Date(c.created_at)).replace(",", ""),
        c.visitor_name,
        c.phone,
        chatCategoryLabel(c.category, locale),
        c.age,
        c.occupation,
        occupationGroupLabel(c.occupation_group, locale),
        c.ai_summary,
        c.ai_summary_en,
        c.message_count,
        isFlagged(c) ? yes[locale] : no[locale],
        c.suspicious_reason,
        c.locale,
      ]
        // Excel reads 01712345678 as a number and drops the 0; a formula that
        // returns text keeps it. The phone is validated digits, so this is
        // the one cell allowed to be a formula.
        .map((value, index) => (index === 2 ? quote(`="${value}"`) : cell(value)))
        .join(",")
    ),
  ];

  const name =
    filters.from === filters.to
      ? `chat-cases-${filters.from}.csv`
      : `chat-cases-${filters.from}_to_${filters.to}.csv`;

  // The BOM makes Excel read the file as UTF-8; without it Bengali turns to
  // mojibake.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
