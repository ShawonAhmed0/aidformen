import { requireAdmin } from "@/lib/actions/shared";
import { filterCases, getChatCases, parseCaseFilters } from "@/lib/content/chat-cases";
import {
  ageBands,
  breakdown,
  categoryRows,
  countDocuments,
  getRangeSummary,
} from "@/lib/content/chat-reports";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { addSheet, newWorkbook, xlsxResponse } from "@/lib/reports/workbook";
import {
  chatCategoryLabel,
  isFlagged,
  occupationGroupLabel,
  occupationGroups,
} from "@/lib/types/chatbot";

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

const sheets = {
  bn: {
    chats: "চ্যাট",
    byType: "সমস্যার ধরন",
    byAge: "বয়স",
    byOccupation: "পেশা",
    summary: "সারসংক্ষেপ",
    type: "সমস্যার ধরন",
    age: "বয়স",
    occupation: "পেশা",
    count: "চ্যাট",
    share: "শতকরা",
    notClear: "এখনো বোঝা যায়নি",
    item: "বিষয়",
    value: "মান",
    period: "সময়",
    totalChats: "চ্যাট (সন্দেহজনক বাদে)",
    people: "আলাদা নম্বর",
    flagged: "সন্দেহজনক (বাদ)",
    documents: "জমা পড়া নথি",
    aiSummary: "AI সারসংক্ষেপ",
    countedNote: "এই শিটে সন্দেহজনক চ্যাট বাদ দিয়ে গোনা হয়েছে।",
  },
  en: {
    chats: "Chats",
    byType: "By problem type",
    byAge: "By age",
    byOccupation: "By occupation",
    summary: "Summary",
    type: "Problem type",
    age: "Age",
    occupation: "Occupation",
    count: "Chats",
    share: "Share",
    notClear: "Not clear yet",
    item: "Item",
    value: "Value",
    period: "Period",
    totalChats: "Chats (suspicious left out)",
    people: "Different numbers",
    flagged: "Suspicious (left out)",
    documents: "Documents received",
    aiSummary: "AI summary",
    countedNote: "Suspicious chats are left out of the counts on this sheet.",
  },
};

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
 * The Problem feed as a CSV or an Excel workbook (`?format=xlsx`), with the
 * same filters as the page. Every chat in the range is listed, flagged ones
 * marked rather than dropped, so the file can be re-counted however the reader
 * wants. The workbook adds the breakdowns and the AI summary on their own
 * sheets.
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

  const values = rows.map((c) => [
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
  ]);

  const base =
    filters.from === filters.to
      ? `chat-cases-${filters.from}`
      : `chat-cases-${filters.from}_to_${filters.to}`;

  if (params.format === "xlsx") {
    const s = sheets[locale];
    const stats = breakdown(rows);
    const share = (n: number) => (stats.total ? Math.round((n / stats.total) * 1000) / 10 : 0);
    const [summary, documents] = await Promise.all([
      getRangeSummary(filters.from, filters.to),
      countDocuments(filters.from, filters.to),
    ]);

    const workbook = newWorkbook();
    // In Excel the phone is a text cell, so its leading 0 survives as typed.
    addSheet(workbook, s.chats, headers[locale], values, [17, 22, 14, 26, 7, 22, 18, 60, 60, 9, 10, 30, 7]);
    addSheet(
      workbook,
      s.byType,
      [s.type, s.count, `${s.share} %`],
      categoryRows
        .map((id) => [chatCategoryLabel(id, locale) ?? s.notClear, stats.byCategory.get(id) ?? 0])
        .filter((row) => (row[1] as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map((row) => [...row, share(row[1] as number)]),
      [34, 10, 10]
    );
    addSheet(
      workbook,
      s.byAge,
      [s.age, s.count, `${s.share} %`],
      ageBands.map((b) => [b[locale], stats.byAge.get(b.id) ?? 0, share(stats.byAge.get(b.id) ?? 0)]),
      [16, 10, 10]
    );
    addSheet(
      workbook,
      s.byOccupation,
      [s.occupation, s.count, `${s.share} %`],
      occupationGroups
        .map((g) => [g[locale], stats.byOccupation.get(g.id) ?? 0, share(stats.byOccupation.get(g.id) ?? 0)])
        .filter((row) => (row[1] as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number)),
      [26, 10, 10]
    );
    addSheet(
      workbook,
      s.summary,
      [s.item, s.value],
      [
        [s.period, filters.from === filters.to ? filters.from : `${filters.from} – ${filters.to}`],
        [s.totalChats, stats.total],
        [s.people, stats.people],
        [s.flagged, stats.flagged],
        [s.documents, documents ?? "—"],
        [s.aiSummary, summary ? (locale === "en" ? summary.summary_en : summary.summary_bn) : "—"],
        ["", s.countedNote],
      ],
      [26, 90]
    );
    return xlsxResponse(workbook, `${base}.xlsx`);
  }

  const lines = [
    headers[locale].map(cell).join(","),
    ...values.map((row) =>
      row
        // Excel reads 01712345678 as a number and drops the 0; a formula that
        // returns text keeps it. The phone is validated digits, so this is
        // the one cell allowed to be a formula.
        .map((value, index) => (index === 2 ? quote(`="${value}"`) : cell(value)))
        .join(",")
    ),
  ];
  const name = `${base}.csv`;

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
