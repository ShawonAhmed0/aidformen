import { createHash, randomBytes } from "node:crypto";

import { requireAdmin } from "@/lib/actions/shared";
import { getChatCases, parseCaseFilters } from "@/lib/content/chat-cases";
import { ageBand, ageBands, categoryRows, counted } from "@/lib/content/chat-reports";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { addSheet, newWorkbook, xlsxResponse } from "@/lib/reports/workbook";
import { chatCategoryLabel, occupationGroupLabel } from "@/lib/types/chatbot";

/** Counts below this are shown as "<5": a small group can point to one person. */
const SUPPRESS_BELOW = 5;

const copy = {
  bn: {
    cases: "পরিচয়হীন কেস",
    counts: "ধরন × বয়স",
    about: "পদ্ধতি",
    id: "পরিচয়হীন আইডি",
    month: "মাস",
    type: "সমস্যার ধরন",
    age: "বয়সের সীমা",
    occupation: "পেশার শ্রেণি",
    notClear: "এখনো বোঝা যায়নি",
    note: "নোট",
    notes: [
      "নাম, মোবাইল নম্বর ও পুরো কথোপকথন এই ফাইলে নেই।",
      "পরিচয়হীন আইডি শুধু এই ফাইলের ভেতরে একই ব্যক্তিকে চেনায়; প্রতিবার ডাউনলোডে নতুন আইডি তৈরি হয়, তাই আলাদা ফাইল মিলিয়ে কাউকে খোঁজা যায় না।",
      "বয়স সীমা হিসেবে এবং সময় শুধু মাস হিসেবে দেওয়া আছে।",
      `"ধরন × বয়স" শিটে ${SUPPRESS_BELOW}-এর কম সংখ্যা "<${SUPPRESS_BELOW}" হিসেবে লুকানো আছে।`,
      "সন্দেহজনক চ্যাট ও AI-এর লেখা সারসংক্ষেপ বাদ দেওয়া হয়েছে — সারসংক্ষেপে কখনো জায়গার নাম চলে আসে।",
      "চ্যাট কম হলে মাস, ধরন, বয়স ও পেশা মিলিয়েও কাউকে চেনা যেতে পারে; ফাইলটি সাবধানে শেয়ার করুন।",
    ],
  },
  en: {
    cases: "Anonymous cases",
    counts: "Type x age",
    about: "Method",
    id: "Anonymous ID",
    month: "Month",
    type: "Problem type",
    age: "Age band",
    occupation: "Occupation group",
    notClear: "Not clear yet",
    note: "Note",
    notes: [
      "Names, mobile numbers and full conversations are not in this file.",
      "An anonymous ID only links one person's chats within this file; every download makes new IDs, so separate files cannot be matched to track someone.",
      "Age is given as a band and time as a month only.",
      `On the "Type x age" sheet, counts below ${SUPPRESS_BELOW} are hidden as "<${SUPPRESS_BELOW}".`,
      "Suspicious chats and the AI-written summaries are left out — summaries sometimes carry place names.",
      "With few chats, month, type, age band and occupation together can still point to one person; share the file with care.",
    ],
  },
};

/**
 * Chats for case studies and research, with identity stripped. Built for
 * sharing outside the admin team, so it is stricter than the regular export.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return new Response(auth.error, { status: 403 });

  const locale = await getAdminLocale();
  const t = copy[locale];
  const filters = parseCaseFilters(Object.fromEntries(new URL(request.url).searchParams));
  const result = await getChatCases({ ...filters, category: null, view: "all" });
  if (!result.ok) return new Response("Could not load the conversations.", { status: 503 });

  // A fresh secret per file: the same number gives the same ID here, and an
  // unrelated one in any other download.
  const salt = randomBytes(16);
  const anonId = (phone: string) =>
    `P-${createHash("sha256").update(salt).update(phone).digest("hex").slice(0, 8).toUpperCase()}`;

  const chats = counted(result.cases).map((c) => ({
    id: anonId(c.phone),
    month: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" }).format(
      new Date(c.created_at)
    ),
    category: c.category,
    band: ageBand(c.age),
    occupation: c.occupation_group ?? "unknown",
  }));
  // By month, then ID — never in arrival order, which could be matched to a
  // known visit time.
  chats.sort((a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id));

  const workbook = newWorkbook();
  addSheet(
    workbook,
    t.cases,
    [t.id, t.month, t.type, t.age, t.occupation],
    chats.map((c) => [
      c.id,
      c.month,
      chatCategoryLabel(c.category, locale) ?? t.notClear,
      ageBands.find((b) => b.id === c.band)?.[locale],
      occupationGroupLabel(c.occupation, locale),
    ]),
    [13, 10, 34, 14, 22]
  );

  const cell = (n: number) => (n === 0 ? 0 : n < SUPPRESS_BELOW ? `<${SUPPRESS_BELOW}` : n);
  addSheet(
    workbook,
    t.counts,
    [t.type, ...ageBands.map((b) => b[locale])],
    categoryRows
      .map((id) => {
        const inType = chats.filter((c) => c.category === id);
        return inType.length === 0
          ? null
          : [
              chatCategoryLabel(id, locale) ?? t.notClear,
              ...ageBands.map((b) => cell(inType.filter((c) => c.band === b.id).length)),
            ];
      })
      .filter((row) => row !== null),
    [30, ...ageBands.map(() => 11)]
  );
  addSheet(workbook, t.about, [t.note], t.notes.map((n) => [n]), [110]);

  return xlsxResponse(workbook, `chat-research-anonymous-${filters.from}_to_${filters.to}.xlsx`);
}
