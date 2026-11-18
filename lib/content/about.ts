import type { Locale } from "@/lib/i18n/config";

/**
 * Editorial copy for the about page.
 *
 * `lib/i18n/dictionary.ts` is deliberately chrome-only and the rest of the
 * site's prose comes from the database. This page is neither: it is a fixed
 * institutional statement that has to ship with the code, so it lives beside
 * the route it belongs to rather than polluting the dictionary.
 *
 * The text is the foundation's own document ("Our contributions, the men's
 * rights movement and our demands"), Bengali and English as supplied. Only the
 * timeline is restated from it: its dates, pulled out of the opening prose so
 * they can be scanned.
 */

/** Photo paths are locale-independent; only alt text and captions translate. */
export const aboutPhotos = {
  rally: "/about-section/1605975526.jpg",
  acidProtest: "/about-section/1603378398.jpg",
  humanChain: "/about-section/1605972841.jpg",
  roundtable: "/about-section/1603379355.jpg",
  seminar: "/about-section/1603375562.jpg",
} as const;

export type PhotoId = keyof typeof aboutPhotos;

type Photo = { alt: string; caption: string };

/** A court outcome the document reports, shown as a badge on the item. */
export type AboutStatus = "won" | "ongoing";

type LabelledItem = { label: string; text: string; status?: AboutStatus };

type Part = { /** Short label for the in-page contents. */ nav: string; title: string };

export type AboutContent = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; subtitle: string };
  sectionsLabel: string;
  status: Record<AboutStatus, string>;
  journey: Part & {
    paragraphs: string[];
    timelineLabel: string;
    timeline: { when: string; text: string }[];
  };
  achievements: Part & { intro: string; items: LabelledItem[] };
  demands: Part & { intro: string; items: LabelledItem[] };
  commitment: Part & { body: string; contact: string; mediaCenter: string };
  photos: Record<PhotoId, Photo>;
};

const bn: AboutContent = {
  meta: {
    title: "আমাদের সম্পর্কে",
    description: "এইড ফর মেন ফাউন্ডেশন — আমাদের পথচলা, দীর্ঘ সংগ্রামের অর্জন এবং পুরুষের মানবাধিকার ও আইনি সমতার ১৩ দফা দাবি।",
  },
  hero: {
    eyebrow: "এইড ফর মেন ফাউন্ডেশন (Aid For Men Foundation)",
    title: "আমাদের সম্পর্কে",
    subtitle: "আমাদের অবদান, পুরুষ আন্দোলনের অবদান এবং আমাদের দাবি",
  },
  sectionsLabel: "এই পাতায়",
  status: { won: "রিটে বিজয়", ongoing: "আইনি লড়াই চলমান" },
  journey: {
    nav: "আমাদের পথচলা",
    title: "এক যুগান্তকারী সংগ্রামের পথচলা",
    paragraphs: [
      "সমাজে নারী ও শিশুর অধিকার নিয়ে বহু আলোচনা হলেও, পুরুষের মানবাধিকার, আইনি সুরক্ষা এবং পারিবারিক সমতা নিশ্চিত করার বিষয়টি দীর্ঘকাল উপেক্ষিত ছিল। ২০১২-১৩ সালের দিকে এই অবহেলিত জনগোষ্ঠীর অধিকার ও আইনি সুরক্ষার পক্ষে যখন প্রাতিষ্ঠানিক উদ্যোগ শুরু হয়, তখন বিষয়টি সমাজে একরকম অস্পৃশ্য বা ট্যাবু হিসেবে দেখা হতো। তবে অদম্য মনোবল ও সুনির্দিষ্ট যৌক্তিক অবস্থানের ফলে ২০১৭-১৮ সালের মধ্যে এই আন্দোলন একটি শক্তিশালী সাংগঠনিক ভিত্তি লাভ করে এবং সারা দেশের পুরুষ অধিকারকর্মী ও সচেতন মানুষ এই প্ল্যাটফর্মে সমবেত হন। দীর্ঘ সংগ্রাম ও ধারাবাহিক কার্যক্রমের পর ২০২০ সালে ‘এইড ফর মেন ফাউন্ডেশন’ সরকারিভাবে রেজিস্ট্রেশন লাভ করে এবং আইনি কাঠামোর ভেতর থেকে আরও জোরালোভাবে কার্যক্রম পরিচালনা করে যাচ্ছে।",
      "আজকের সমাজে পুরুষ অধিকার আন্দোলন আর কোনো ট্যাবু নয়; বরং সাধারণ মানুষ ও নীতিনির্ধারকরা এখন পুরুষের অধিকারের বিষয়টিকে অত্যন্ত গুরুত্বের সাথে দেখছেন, আলোচনা করছেন এবং সংগঠনের এই উদ্যোগকে ইতিবাচকভাবে মূল্যায়ন করছেন।",
    ],
    timelineLabel: "পথচলার মাইলফলক",
    timeline: [
      { when: "২০১২–১৩", text: "পুরুষের অধিকার ও আইনি সুরক্ষার পক্ষে প্রাতিষ্ঠানিক উদ্যোগের সূচনা" },
      { when: "২০১৭–১৮", text: "আন্দোলন শক্তিশালী সাংগঠনিক ভিত্তি লাভ করে; সারা দেশের অধিকারকর্মীরা এক প্ল্যাটফর্মে" },
      { when: "২০২০", text: "‘এইড ফর মেন ফাউন্ডেশন’ সরকারি রেজিস্ট্রেশন লাভ করে" },
      { when: "১৯ নভেম্বর ২০২০", text: "ঢাকা রিপোর্টার্স ইউনিটিতে ১৩ দফা দাবি আনুষ্ঠানিকভাবে উপস্থাপন" },
    ],
  },
  achievements: {
    nav: "অর্জনসমূহ",
    title: "দীর্ঘ সংগ্রামের উল্লেখযোগ্য অর্জনসমূহ",
    intro: "প্রতিষ্ঠালগ্ন থেকে অদ্যাবধি ‘এইড ফর মেন ফাউন্ডেশন’-এর বেশ কিছু ঐতিহাসিক ও যুগান্তকারী অর্জন রয়েছে, যা দেশের আইনি ও সামাজিক পরিমণ্ডলে ইতিবাচক প্রভাব ফেলেছে:",
    items: [
      {
        label: "সামাজিক দৃষ্টিভঙ্গির পরিবর্তন",
        text: "একসময় পুরুষ অধিকারের কথা বলা মানেই নেতিবাচক বা অপ্রাসঙ্গিক কিছু মনে করা হতো। আমাদের ধারাবাহিক প্রচারণার ফলে বর্তমানে সমাজ এই আন্দোলনকে একটি বাস্তবসম্মত ও ন্যায়সংগত মানবাধিকার আন্দোলন হিসেবে গ্রহণ করেছে।",
      },
      {
        label: "জাতীয় আলোচনায় পুরুষ অধিকার",
        text: "দীর্ঘকাল আড়ালে থাকা পুরুষ নির্যাতন ও আইনি বৈষম্যের বিষয়টিকে মূলধারার গণমাধ্যম ও সামাজিক আলোচনার কেন্দ্রবিন্দুতে নিয়ে আসা সম্ভব হয়েছে।",
      },
      {
        label: "বিবাহ ও তালাক রেজিস্ট্রেশন ডিজিটালাইজেশন",
        text: "বিবাহ এবং তালাক রেজিস্ট্রি কার্যক্রমে অনিয়ম, বহুবিবাহ প্রতারণা ও ভুয়া কাবিন জালিয়াতি রোধে ‘এইড ফর মেন ফাউন্ডেশন’ মহামান্য হাইকোর্টে রিট দায়ের করে এবং সেই ঐতিহাসিক রিটে বিজয় লাভ করে। এর ফলে দেশজুড়ে বিবাহ ও তালাক নিবন্ধনের ডিজিটাল প্রক্রিয়া বাস্তবায়নের পথ সুগম হয়েছে, যা অসংখ্য পরিবারকে আইনি হয়রানি থেকে সুরক্ষা দিচ্ছে।", status: "won",
      },
      {
        label: "বিয়ের প্রলোভনে ধর্ষণ আইনের চ্যালেঞ্জ",
        text: "বর্তমান আইনে প্রাপ্তবয়স্ক নর-নারীর সম্মতিতে শারীরিক সম্পর্ককে একপেশেভাবে আইনের আওতায় এনে পুরুষদের হয়রানির শিকার হওয়ার প্রবণতাকে চ্যালেঞ্জ করে উচ্চ আদালতে রিট ও আইনি লড়াই চলমান রয়েছে।", status: "ongoing",
      },
      {
        label: "জাতীয় ও আন্তর্জাতিক গণমাধ্যমে স্বীকৃতি",
        text: "২০২০ সালের ১৯ নভেম্বর আন্তর্জাতিক পুরুষ দিবসে ঢাকা রিপোর্টার্স ইউনিটিতে বর্ণাঢ্য আয়োজনের মধ্য দিয়ে সংগঠনটি ১৩ দফা দাবি জাতির সামনে আনুষ্ঠানিকভাবে উপস্থাপন করে। আরটিভি নিউজসহ দেশের প্রথমসারির জাতীয় গণমাধ্যমে আমাদের এই দাবিনামা ও কার্যক্রম গুরুত্বের সাথে প্রচারিত হয়।",
      },
    ],
  },
  demands: {
    nav: "১৩ দফা দাবি",
    title: "‘এইড ফর মেন ফাউন্ডেশন’-এর ১৩ দফা দাবি",
    intro: "পুরুষের মানবাধিকার রক্ষা ও সমাজে পূর্ণাঙ্গ আইনি সমতা প্রতিষ্ঠার লক্ষ্যে ‘এইড ফর মেন ফাউন্ডেশন’ নিম্নোক্ত ১৩ দফা দাবি বাস্তবায়নের জন্য কাজ করে যাচ্ছে:",
    items: [
      {
        label: "অপহরণ আইনের সংস্কার",
        text: "বিবাহের উদ্দেশ্যে বা প্রেমঘটিত কারণে কোনো ছেলে বা মেয়ে স্বেচ্ছায় পালিয়ে গেলে উক্ত ঘটনাকে অপহরণ হিসেবে অন্তর্ভুক্ত না করা এবং শুধুমাত্র ছেলে ও তার পরিবারের বিরুদ্ধে একপেশে মামলা ও শাস্তির বিধান বাতিল করা।",
      },
      {
        label: "পারিবারিক সহিংসতা আইন",
        text: "‘পারিবারিক সহিংসতা (প্রতিরোধ ও সুরক্ষা) আইন ২০১০’-এ সংযুক্ত ব্যক্তি হিসেবে শিশু ও নারীর পাশাপাশি পুরুষকেও অন্তর্ভুক্ত করা।",
      },
      {
        label: "লিঙ্গনিরপেক্ষ সম্মতির আইন",
        text: "বিয়ের প্রতিশ্রুতিতে প্রাপ্তবয়স্ক নর-নারীর সম্মতিতে শারীরিক সম্পর্ককে ‘ধর্ষণ’ হিসেবে সংজ্ঞায়িত না করা এবং এক্ষেত্রে শাস্তির বিধান থাকলে তা নারী-পুরুষ উভয়ের জন্য সমান রাখা।",
      },
      {
        label: "পুরুষ ধর্ষণের স্বতন্ত্র সংজ্ঞা",
        text: "নারী ধর্ষণ ও শিশু ধর্ষণকে আলাদা সংজ্ঞায় সংজ্ঞায়িত করে পুরুষ ধর্ষণের স্বতন্ত্র সংজ্ঞা তৈরিপূর্বক একটি লিঙ্গনিরপেক্ষ ধর্ষণ আইন প্রণয়ন করা।",
      },
      {
        label: "বৈবাহিক ধর্ষণের ধারণা বর্জন",
        text: "পারিবারিক জীবনব্যবস্থা, সভ্য সমাজব্যবস্থা, ব্যক্তিগত আইন এবং পুরুষদের মানবাধিকারের বিষয়টি বিবেচনায় নিয়ে দেশীয় আইনে পশ্চিমা সংস্কৃতিতে সৃষ্ট তথাকথিত ‘বৈবাহিক ধর্ষণ’-এর ধারণার অনুপ্রবেশ না ঘটানো।",
      },
      {
        label: "মিথ্যা মামলার কঠোর শাস্তি",
        text: "মিথ্যা ধর্ষণ মামলা প্রমাণিত হলে মামলাকারীর বিরুদ্ধে ধর্ষকের সমমানের কঠিন শাস্তির বিধান নিশ্চিত করা।",
      },
      {
        label: "যৌতুক মামলা সুরক্ষা",
        text: "যৌতুক সংক্রান্ত মামলায় সমন বা গ্রেপ্তারি পরোয়ানা ইস্যুর পূর্বে পুঙ্খানুপুঙ্খ তদন্ত প্রতিবেদন বাধ্যতামূলক করা।",
      },
      {
        label: "পুরুষত্বহীন করার সর্বোচ্চ শাস্তি",
        text: "পুরুষের লিঙ্গ কর্তন বা অন্য কোনো উপায়ে কোনো পুরুষকে পুরুষত্বহীন করার শাস্তি মৃত্যুদণ্ড নির্ধারণ করা।",
      },
      {
        label: "ডিজিটাল বিবাহ রেজিস্ট্রি",
        text: "বহুবিবাহ প্রতারণা রোধে বিবাহ রেজিস্ট্রেশন পদ্ধতি সম্পূর্ণ ডিজিটালাইজ করা (যে দাবিতে সংগঠন ইতোমধ্যে হাইকোর্টের রিটে জয়লাভ করেছে)।", status: "won",
      },
      {
        label: "পুরুষ নির্যাতন রোধে আইন",
        text: "পুরুষের মানবাধিকার রক্ষা ও পুরুষ নির্যাতন রোধে সুনির্দিষ্ট স্বতন্ত্র আইন প্রণয়ন করা।",
      },
      {
        label: "কাবিন বাণিজ্য রোধ",
        text: "সাধ্যের অতিরিক্ত কাবিন জোর করে চাপিয়ে দেওয়া নিষিদ্ধ করে সুস্পষ্ট আইনি বিধান তৈরি করা।",
      },
      {
        label: "ব্যভিচার আইনের সংস্কার",
        text: "দণ্ডবিধির ৪৯৭ ধারা সংশোধন করে পরকীয়ায় আসক্ত নারী ও পুরুষ উভয়ের জন্যই সমান শাস্তির বিধান নিশ্চিত করা।",
      },
      {
        label: "পুরুষ বিষয়ক মন্ত্রণালয়",
        text: "পুরুষদের সামগ্রিক সুরক্ষা, কল্যাণ ও অধিকার নিশ্চিত করতে আলাদা ‘পুরুষ বিষয়ক মন্ত্রণালয়’ গঠন করা।",
      },
    ],
  },
  commitment: {
    nav: "আমাদের অঙ্গীকার",
    title: "আমাদের অঙ্গীকার",
    body: "‘এইড ফর মেন ফাউন্ডেশন’-এর এই আন্দোলন কোনো লিঙ্গ বা পক্ষের বিরুদ্ধে নয়; বরং এটি মানবাধিকার, ন্যায়বিচার এবং সাংবিধানিক সমতার পক্ষে একটি যৌক্তিক ও শান্তিপূর্ণ লড়াই। দেশের সচেতন নাগরিক সমাজ ও আইনজ্ঞদের সহযোগিতায় সংগঠনটি তার আইনি ও সামাজিক কার্যক্রম অব্যাহত রেখেছে। যতদিন পর্যন্ত সমাজে পূর্ণাঙ্গ আইনি ভারসাম্য এবং পুরুষদের মানবাধিকার প্রতিষ্ঠিত না হয়, ততদিন ‘এইড ফর মেন ফাউন্ডেশন’-এর এই ধারাবাহিক আন্দোলন অপ্রতিরোধ্য গতিতে এগিয়ে যাবে।",
    contact: "যোগাযোগ করুন",
    mediaCenter: "মিডিয়া সেন্টার দেখুন",
  },
  photos: {
    rally: {
      alt: "আন্তর্জাতিক পুরুষ দিবস ২০২০ উপলক্ষে ব্যানার ও বেলুন হাতে র‍্যালিতে অংশগ্রহণকারীরা",
      caption: "আন্তর্জাতিক পুরুষ দিবস ২০২০ উপলক্ষে বর্ণাঢ্য র‍্যালি, ঢাকা।",
    },
    acidProtest: {
      alt: "রাস্তার পাশে ব্যানার হাতে মানববন্ধনে দাঁড়ানো অংশগ্রহণকারীরা",
      caption:
        "বৈমানিক পারভেজ সানজারির উপর অ্যাসিড হামলার বিচার দাবিতে মানববন্ধন।",
    },
    humanChain: {
      alt: "রাজু ভাস্কর্যের সামনে ব্যানার হাতে মানববন্ধনে দাঁড়ানো অংশগ্রহণকারীরা",
      caption: "লিঙ্গ-নিরপেক্ষ আইনের দাবিতে মানববন্ধন, রাজু ভাস্কর্য, ঢাকা।",
    },
    roundtable: {
      alt: "আন্তর্জাতিক পুরুষ দিবস উপলক্ষে আয়োজিত মতবিনিময় সভার মঞ্চ ও অংশগ্রহণকারীরা",
      caption:
        "‘নারী নির্যাতন আইনের অপপ্রয়োগ রোধে আমাদের করণীয়’ শীর্ষক মতবিনিময় সভা।",
    },
    seminar: {
      alt: "প্ল্যাকার্ড হাতে আলোচনা সভায় অংশগ্রহণকারীদের দলগত ছবি",
      caption:
        "‘পুরুষ নির্যাতন রোধে করণীয়’ শীর্ষক আলোচনা সভায় অংশগ্রহণকারীরা।",
    },
  },
};

const en: AboutContent = {
  meta: {
    title: "About us",
    description: "Aid For Men Foundation — our journey, the milestones of a long struggle, and our 13-point demands for men’s human rights and legal equality.",
  },
  hero: {
    eyebrow: "Aid For Men Foundation",
    title: "About us",
    subtitle: "Our Contributions, the Men’s Rights Movement, and Our Demands",
  },
  sectionsLabel: "On this page",
  status: { won: "Writ won", ongoing: "Legal challenge ongoing" },
  journey: {
    nav: "Our journey",
    title: "A Groundbreaking Journey of Struggle",
    paragraphs: [
      "While the rights of women and children have long been widely discussed in society, the issue of ensuring men’s human rights, legal protection, and family equality remained neglected for decades. When institutional initiatives began around 2012–2013 to advocate for the rights and legal protections of this overlooked demographic, the topic was treated almost as an untouchable taboo in society. However, driven by unwavering determination and clear, logical arguments, the movement gained a strong organizational footing by 2017–2018, bringing together men’s rights activists and conscious citizens from across the country onto a single platform. Following years of persistent struggle and continuous advocacy, Aid For Men Foundation received official government registration in 2020 and has since been operating with even greater momentum within the legal framework.",
      "Today, the men’s rights movement is no longer a taboo; rather, the general public and policymakers now take the issue of men’s rights seriously, engage in open discussions, and positively value the organization’s initiatives.",
    ],
    timelineLabel: "Milestones of the journey",
    timeline: [
      { when: "2012–13", text: "Institutional advocacy for men’s rights and legal protection begins" },
      { when: "2017–18", text: "The movement gains a strong organizational footing, uniting activists nationwide" },
      { when: "2020", text: "Aid For Men Foundation receives official government registration" },
      { when: "19 Nov 2020", text: "The 13-point charter of demands is presented at the Dhaka Reporters Unity" },
    ],
  },
  achievements: {
    nav: "Achievements",
    title: "Milestone Achievements of a Long Struggle",
    intro: "Since its inception, Aid For Men Foundation has achieved several historic and transformative milestones that have made a lasting impact on the country’s legal and social landscape:",
    items: [
      {
        label: "Shifting Social Perceptions",
        text: "Speaking up for men’s rights was once dismissed as negative or irrelevant. Through continuous awareness campaigns, society now recognizes this movement as a realistic and legitimate human rights cause.",
      },
      {
        label: "Bringing Men’s Rights into National Discourse",
        text: "Issues of domestic abuse against men and legal discrimination—long kept in the shadows—have been successfully brought to the forefront of mainstream media and public debate.",
      },
      {
        label: "Digitalization of Marriage and Divorce Registration",
        text: "To prevent irregularities, polygamy fraud, and fake kabin (dower) scams in marriage and divorce registration, Aid For Men Foundation filed a writ petition in the Hon’ble High Court and secured a landmark victory. This paved the way for nationwide digital marriage and divorce registration, protecting countless families from legal harassment.", status: "won",
      },
      {
        label: "Challenging the “Rape on the Pretext of Marriage” Law",
        text: "The organization is actively pursuing a writ petition and legal battle in the higher courts to challenge the one-sided application of laws that criminalize consensual physical relationships between adults under the pretext of a marriage promise, which has frequently been used to harass men.", status: "ongoing",
      },
      {
        label: "National and International Media Recognition",
        text: "On International Men’s Day, November 19, 2020, the foundation formally presented its 13-point charter of demands to the nation at a prominent event at the Dhaka Reporters Unity. The demands and activities received widespread coverage across leading national media outlets, including RTV News.",
      },
    ],
  },
  demands: {
    nav: "13-point demands",
    title: "The 13-Point Demands of Aid For Men Foundation",
    intro: "To safeguard men’s human rights and establish complete legal equality in society, Aid For Men Foundation is working toward the implementation of the following 13 demands:",
    items: [
      {
        label: "Reform of Abduction Laws",
        text: "Exclude voluntary elopement by consenting adults for marriage or love from being classified as “abduction,” and abolish one-sided criminal cases and punishments filed solely against the man and his family.",
      },
      {
        label: "Inclusion in the Domestic Violence Act",
        text: "Include men alongside women and children as protected individuals under the Domestic Violence (Prevention and Protection) Act, 2010.",
      },
      {
        label: "Gender-Neutral Consent Laws",
        text: "Do not classify consensual physical relationships between adults based on a promise of marriage as “rape,” and if any legal penalty applies in such cases, ensure it is equal for both men and women.",
      },
      {
        label: "Separate Legal Definition for Male Rape",
        text: "Define rape of women and rape of children separately, establish a distinct legal definition for the rape of men, and enact a gender-neutral rape law.",
      },
      {
        label: "Rejection of the “Marital Rape” Concept",
        text: "Taking into account the traditional family structure, civilized social norms, personal laws, and men’s human rights, prevent the intrusion of the Western concept of so-called “marital rape” into domestic law.",
      },
      {
        label: "Strict Punishment for False Cases",
        text: "Ensure strict punishment—equivalent to that of a rapist—for complainants if a rape allegation is proven to be false.",
      },
      {
        label: "Safeguards in Dowry Cases",
        text: "Make a thorough preliminary investigation report mandatory before issuing a summons or arrest warrant in dowry-related cases.",
      },
      {
        label: "Capital Punishment for Emasculation",
        text: "Establish the death penalty as the punishment for severing a man’s genitals or rendering a man impotent by any other means.",
      },
      {
        label: "Digital Marriage Registration",
        text: "Fully digitalize the marriage registration system to prevent polygamy fraud (a demand on which the foundation has already won a High Court writ).", status: "won",
      },
      {
        label: "Legislation Against Men’s Abuse",
        text: "Enact a specific, standalone law to protect men’s human rights and prevent abuse and torture against men.",
      },
      {
        label: "Curbing Kabin Commercialization",
        text: "Enact clear legal provisions prohibiting the imposition of excessive kabin (dower) amounts beyond a man’s financial capacity.",
      },
      {
        label: "Reform of Adultery Laws",
        text: "Amend Section 497 of the Penal Code to ensure equal punishment for both men and women involved in extramarital affairs.",
      },
      {
        label: "Ministry of Men’s Affairs",
        text: "Establish a separate “Ministry of Men’s Affairs” to ensure the comprehensive protection, welfare, and rights of men.",
      },
    ],
  },
  commitment: {
    nav: "Our commitment",
    title: "Our Commitment",
    body: "The movement led by Aid For Men Foundation is not against any gender or group; rather, it is a logical and peaceful struggle for human rights, justice, and constitutional equality. With the support of conscious civil society and legal experts across the country, the organization continues its legal and social advocacy. Until complete legal balance and the human rights of men are firmly established in society, Aid For Men Foundation’s continuous movement will march forward with unstoppable momentum.",
    contact: "Get in touch",
    mediaCenter: "Visit the Media Center",
  },
  photos: {
    rally: {
      alt: "Participants marching with banners and balloons on International Men's Day 2020",
      caption: "Rally marking International Men's Day 2020, Dhaka.",
    },
    acidProtest: {
      alt: "Participants standing at the roadside holding banners in a human chain",
      caption:
        "Human chain demanding justice for the acid attack on pilot Parvez Sanjari.",
    },
    humanChain: {
      alt: "Participants holding banners in a human chain in front of the Raju Memorial Sculpture",
      caption:
        "Human chain demanding gender-neutral laws, Raju Memorial Sculpture, Dhaka.",
    },
    roundtable: {
      alt: "Speakers and participants at a roundtable held on International Men's Day",
      caption:
        "Roundtable on preventing the misuse of laws against violence against women.",
    },
    seminar: {
      alt: "Group photograph of participants holding placards at a seminar",
      caption: "Participants at a seminar on preventing violence against men.",
    },
  },
};

const content: Record<Locale, AboutContent> = { bn, en };

export function getAboutContent(locale: Locale): AboutContent {
  return content[locale] ?? content.bn;
}
