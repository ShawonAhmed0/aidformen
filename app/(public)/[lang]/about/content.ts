import type { Locale } from "@/lib/i18n/config";

/**
 * Editorial copy for the about page.
 *
 * `lib/i18n/dictionary.ts` is deliberately chrome-only and the rest of the
 * site's prose comes from the database. This page is neither: it is a fixed
 * institutional statement that has to ship with the code, so it lives beside
 * the route it belongs to rather than polluting the dictionary.
 */

/** Photo paths are locale-independent; only alt text and captions translate. */
export const aboutPhotos = {
  rally: "/about-section/1605975526.jpg",
  humanChain: "/about-section/1605972841.jpg",
  roundtable: "/about-section/1603379355.jpg",
  seminar: "/about-section/1603375562.jpg",
  acidProtest: "/about-section/1603378398.jpg",
} as const;

export type PhotoId = keyof typeof aboutPhotos;

/** Keys are shared with the icon map in page.tsx, so order stays free. */
export type MilestoneId =
  | "language"
  | "liberation"
  | "democracy"
  | "uprising";

export type ObjectiveId = "legal" | "litigation" | "equity" | "awareness";

type Photo = { alt: string; caption: string };
type Fact = { label: string; value: string };
type Milestone = {
  id: MilestoneId;
  period: string;
  title: string;
  stat: string;
  statLabel: string;
  body: string;
};
type Objective = { id: ObjectiveId; title: string; body: string };

export type AboutContent = {
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    facts: Fact[];
  };
  background: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  quote: { text: string; source: string };
  history: {
    eyebrow: string;
    title: string;
    description: string;
    milestones: Milestone[];
  };
  inception: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    void: { title: string; women: Fact; men: Fact };
    credential: { title: string; rows: Fact[] };
  };
  mission: {
    eyebrow: string;
    title: string;
    description: string;
    objectives: Objective[];
  };
  gallery: { eyebrow: string; title: string; description: string };
  cta: {
    title: string;
    body: string;
    primary: string;
    secondary: string;
  };
  photos: Record<PhotoId, Photo>;
};

const bn: AboutContent = {
  meta: {
    title: "আমাদের সম্পর্কে",
    description:
      "এইড ফর মেন ফাউন্ডেশন (AMF) — পুরুষের আইনি সুরক্ষা, মানবাধিকার ও একটি বৈষম্যহীন সমাজ গঠনে কাজ করা একটি অরাজনৈতিক ও অলাভজনক সংগঠন। নিবন্ধন নং S-13304/2020।",
  },
  hero: {
    eyebrow: "এইড ফর মেন ফাউন্ডেশন (AMF)",
    title: "আমাদের সম্পর্কে",
    description:
      "পুরুষের আইনি সুরক্ষা, মানবাধিকার এবং একটি ভারসাম্যপূর্ণ ও বৈষম্যহীন সমাজ গঠনে কাজ করা একটি অরাজনৈতিক, অলাভজনক ও স্বেচ্ছাসেবী সংগঠন।",
    facts: [
      { label: "আনুষ্ঠানিক নিবন্ধন", value: "২৩ জানুয়ারি ২০২০" },
      { label: "নিবন্ধন নম্বর", value: "S-13304/2020" },
      { label: "কার্যক্রমের সূচনা", value: "২০১৩–১৪ সাল" },
    ],
  },
  background: {
    eyebrow: "পটভূমি",
    title: "আমাদের পটভূমি ও বাস্তবতা",
    paragraphs: [
      "স্বাধীন বাংলাদেশে সমাজ গঠন, স্বাধীনতা অর্জন এবং যেকোনো জাতীয় সংকটে পুরুষরা সবসময় অগ্রগামী ভূমিকা পালন করেছেন এবং সর্বোচ্চ আত্মত্যাগ স্বীকার করেছেন। ভাষা আন্দোলন, একাত্তরের মহান মুক্তিযুদ্ধ, গণতান্ত্রিক গণ-আন্দোলন থেকে শুরু করে ২০২৪ সালের ছাত্র-জনতার গণ-অভ্যুত্থান পর্যন্ত প্রতিটি ঐতিহাসিক অধ্যায়ে দেশের পুরুষেরা রাজপথে বুক পেতে দিয়েছেন এবং নিজেদের জীবন বিলিয়ে দিয়েছেন।",
      "কিন্তু অত্যন্ত দুঃখজনক হলেও সত্য যে, ত্যাগের সময় রাষ্ট্রের প্রয়োজন কেবল পুরুষের রক্ত ও হাড়ভাঙা শ্রম হলেও, অধিকার ও সুযোগ-সুবিধা বণ্টনের সময় পুরুষকে প্রতিনিয়ত কোণঠাসা ও সুবিধাবঞ্চিত রাখা হচ্ছে।",
      "বর্তমান আইনি ও সামাজিক কাঠামোতে কেবল নারী নির্যাতনের দিকটি একপেশেভাবে প্রচার করা হলেও পুরুষ নির্যাতনের নির্মম বাস্তবতা ও আইনি শূন্যতাকে সম্পূর্ণ আড়াল করে রাখা হয়েছে। মিথ্যা মামলা, পারিবারিক হয়রানি এবং আইনি সুরক্ষাকবচের অভাবে আজ সমাজের বহু পুরুষ নিঃস্ব ও কোণঠাসা জীবনযাপন করতে বাধ্য হচ্ছেন।",
    ],
  },
  quote: {
    text: "অপরাধীর কোনো লিঙ্গ নাই — লিঙ্গ-নিরপেক্ষ আইন চাই।",
    source: "ফাউন্ডেশনের কর্মসূচির স্লোগান",
  },
  history: {
    eyebrow: "ঐতিহাসিক অবদান",
    title: "জাতীয় সংকটে পুরুষের আত্মত্যাগ",
    description:
      "রাষ্ট্রের প্রতিটি সংকটে সামনের সারিতে কারা ছিলেন, সংখ্যাগুলো নিজেই তার উত্তর দেয়।",
    milestones: [
      {
        id: "language",
        period: "১৯৫২",
        title: "ভাষা আন্দোলন",
        stat: "১০০%",
        statLabel: "ভাষা শহীদের সবাই পুরুষ",
        body: "মায়ের ভাষার মর্যাদা রক্ষায় রাজপথে যাঁরা বুকের রক্ত ঢেলে দিয়েছিলেন — রফিক, বরকত, জব্বার, সালামসহ অন্যান্য — তাঁদের শতভাগই ছিলেন পুরুষ।",
      },
      {
        id: "liberation",
        period: "১৯৭১",
        title: "মহান মুক্তিযুদ্ধ",
        stat: "৭ জন",
        statLabel: "বীরশ্রেষ্ঠের প্রত্যেকেই পুরুষ",
        body: "বাংলাদেশের স্বাধীনতার সর্বোচ্চ সম্মাননাপ্রাপ্ত ৭ জন বীরশ্রেষ্ঠের সকলেই পুরুষ। সম্মুখ সমরে অংশ নেওয়া ও শহীদ মুক্তিযোদ্ধাদের ৯৫ শতাংশের বেশি ছিলেন পুরুষ।",
      },
      {
        id: "democracy",
        period: "স্বাধীনতা-উত্তর",
        title: "গণতান্ত্রিক গণ-আন্দোলন",
        stat: "সিংহভাগ",
        statLabel: "নিহতদের অধিকাংশই পুরুষ",
        body: "নূর হোসেন ও ডা. মিলনসহ স্বাধীনতা-উত্তর প্রতিটি প্রধান রাজনৈতিক ও গণতান্ত্রিক গণ-আন্দোলনে নিহতদের সিংহভাগই ছিলেন পুরুষ।",
      },
      {
        id: "uprising",
        period: "২০২৪",
        title: "ছাত্র-জনতার গণ-অভ্যুত্থান",
        stat: "≈ ৯৮%",
        statLabel: "নারী ও শিশু বাদে শহীদদের মধ্যে পুরুষ",
        body: "সরকারি গেজেট অনুযায়ী ৮৩৪ জন শহীদের মধ্যে শিশু ১৩৫ জন এবং নারী ১০–১১ জন। নারী ও শিশু বাদে বাকি প্রায় ৯৮ শতাংশ শহীদই ছিলেন পুরুষ।",
      },
    ],
  },
  inception: {
    eyebrow: "আইনি শূন্যতা",
    title: "আইনি শূন্যতা ও সংগঠনের আত্মপ্রকাশ",
    paragraphs: [
      "নারীদের সুরক্ষার জন্য দেশে সুনির্দিষ্ট ও কঠোর আইন এবং একাধিক রাষ্ট্রীয় মন্ত্রণালয় ও এনজিও থাকলেও, পুরুষ নির্যাতনের শিকার ব্যক্তিদের আইনি ও মানসিক সহায়তা দেওয়ার মতো কোনো প্রাতিষ্ঠানিক ব্যবস্থা বা ‘পুরুষ বিষয়ক মন্ত্রণালয়’ নেই। এই প্রাতিষ্ঠানিক শূন্যতার কারণে পুরুষরা মিথ্যা মামলার শিকার হয়ে সামাজিকভাবে অপদস্থ হচ্ছেন এবং নানা হয়রানির মুখোমুখি হচ্ছেন।",
      "এই চরম আইনি ও সামাজিক বৈষম্যের অন্ধকার ভেদ করে ২০১৩–১৪ সাল থেকে নিবেদিতপ্রাণ পুরুষ অধিকার কর্মীদের ব্যক্তিগত প্রচেষ্টার মধ্য দিয়ে এই সংগঠনের ভিত্তি তৈরি হয়। দীর্ঘ সময় মাঠপর্যায়ে কার্যক্রম পরিচালনার পর প্রতিষ্ঠানটি সোসাইটি রেজিস্ট্রেশন অ্যাক্টের আওতায় আনুষ্ঠানিক আইনি স্বীকৃতি ও নিবন্ধন লাভ করে।",
    ],
    void: {
      title: "প্রাতিষ্ঠানিক শূন্যতা",
      women: {
        label: "নারীদের জন্য",
        value: "সুনির্দিষ্ট ও কঠোর আইন, একাধিক রাষ্ট্রীয় মন্ত্রণালয় ও বহু এনজিও।",
      },
      men: {
        label: "পুরুষদের জন্য",
        value: "কোনো মন্ত্রণালয় নেই, আইনি বা মানসিক সহায়তার কোনো প্রাতিষ্ঠানিক কাঠামোও নেই।",
      },
    },
    credential: {
      title: "আইনি স্বীকৃতি ও নিবন্ধন",
      rows: [
        {
          label: "নিবন্ধনকারী কর্তৃপক্ষ",
          value:
            "যৌথ মূলধন কোম্পানী ও ফার্মসমূহের পরিদপ্তর (RJSC), বাণিজ্য মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
        },
        { label: "আইন", value: "সোসাইটি রেজিস্ট্রেশন অ্যাক্ট, ১৮৬০ (XXI)" },
        { label: "নিবন্ধন নম্বর", value: "S-13304/2020" },
        { label: "নিবন্ধনের তারিখ", value: "২৩ জানুয়ারি ২০২০" },
      ],
    },
  },
  mission: {
    eyebrow: "লক্ষ্য ও উদ্দেশ্য",
    title: "আমরা যা করতে চাই",
    description:
      "যেকোনো প্রকার সরকারি বা আন্তর্জাতিক আর্থিক সহযোগিতা ছাড়াই, কেবল সমাজ ও ব্যবস্থার দ্বিমুখী নীতি মোকাবিলা করে ‘এইড ফর মেন ফাউন্ডেশন’ নিরলসভাবে কাজ করে যাচ্ছে।",
    objectives: [
      {
        id: "legal",
        title: "আইনি সুরক্ষা",
        body: "পুরুষের আইনি সুরক্ষা ও মৌলিক মানবাধিকার নিশ্চিত করা।",
      },
      {
        id: "litigation",
        title: "মিথ্যা মামলায় সহায়তা",
        body: "মিথ্যা ও হয়রানিমূলক মামলার শিকার পুরুষদের আইনি সহায়তা প্রদান।",
      },
      {
        id: "equity",
        title: "বৈষম্যহীন সমাজ",
        body: "পারিবারিক ও সামাজিক বৈষম্য দূর করে একটি ভারসাম্যপূর্ণ ও বৈষম্যহীন সমাজ গঠন।",
      },
      {
        id: "awareness",
        title: "সচেতনতা বৃদ্ধি",
        body: "পুরুষ নির্যাতন ও পুরুষের অধিকার নিয়ে জনসচেতনতা বৃদ্ধি করা।",
      },
    ],
  },
  gallery: {
    eyebrow: "মাঠের কার্যক্রম",
    title: "রাজপথ থেকে আলোচনার টেবিল",
    description:
      "মানববন্ধন, র‍্যালি ও মতবিনিময় সভা — আমাদের কর্মসূচি থেকে কিছু মুহূর্ত।",
  },
  cta: {
    title: "আমাদের কমিউনিটিতে যোগ দিন",
    body: "নিবন্ধন করুন, আলোচনায় অংশ নিন এবং প্রয়োজনে অন্যের পাশে দাঁড়ান।",
    primary: "নিবন্ধন করুন",
    secondary: "যোগাযোগ করুন",
  },
  photos: {
    rally: {
      alt: "আন্তর্জাতিক পুরুষ দিবস ২০২০ উপলক্ষে ব্যানার ও বেলুন হাতে র‍্যালিতে অংশগ্রহণকারীরা",
      caption: "আন্তর্জাতিক পুরুষ দিবস ২০২০ উপলক্ষে বর্ণাঢ্য র‍্যালি, ঢাকা।",
    },
    humanChain: {
      alt: "রাজু ভাস্কর্যের সামনে ব্যানার হাতে মানববন্ধনে দাঁড়ানো অংশগ্রহণকারীরা",
      caption:
        "লিঙ্গ-নিরপেক্ষ আইনের দাবিতে মানববন্ধন, রাজু ভাস্কর্য, ঢাকা।",
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
    acidProtest: {
      alt: "রাস্তার পাশে ব্যানার হাতে মানববন্ধনে দাঁড়ানো অংশগ্রহণকারীরা",
      caption:
        "বৈমানিক পারভেজ সানজারির উপর অ্যাসিড হামলার বিচার দাবিতে মানববন্ধন।",
    },
  },
};

const en: AboutContent = {
  meta: {
    title: "About us",
    description:
      "Aid for Men Foundation (AMF) — a non-political, non-profit organisation working for men's legal protection, human rights and an equitable society. Reg. No. S-13304/2020.",
  },
  hero: {
    eyebrow: "Aid for Men Foundation (AMF)",
    title: "About us",
    description:
      "A non-political, non-profit, volunteer-run organisation working for men's legal protection, human rights, and a balanced, non-discriminatory society.",
    facts: [
      { label: "Formally registered", value: "23 January 2020" },
      { label: "Registration no.", value: "S-13304/2020" },
      { label: "Grassroots work since", value: "2013–14" },
    ],
  },
  background: {
    eyebrow: "Background",
    title: "Our background and reality",
    paragraphs: [
      "Throughout the history of independent Bangladesh, men have consistently played a pioneering role and made supreme sacrifices in nation-building, in winning independence, and in navigating every national crisis. From the Language Movement of 1952 and the glorious Liberation War of 1971 to the democratic mass uprisings and the student-led uprising of July–August 2024, Bangladeshi men have stood at the frontline and laid down their lives.",
      "The stark reality, however, is that while the state relies on men's blood, sweat and sacrifice during a crisis, men are routinely marginalised and deprived when rights, privileges and state benefits are distributed.",
      "Current legal and social narratives focus almost exclusively on violence against women, while the harsh reality of abuse against men and the institutional void around it are left entirely out of view. Without legal safeguards, countless men face false litigation, family harassment and social ostracisation — and are left with nothing.",
    ],
  },
  quote: {
    text: "A crime has no gender — we want gender-neutral laws.",
    source: "Slogan from the foundation's campaigns",
  },
  history: {
    eyebrow: "Historical record",
    title: "Men's sacrifice in national crises",
    description:
      "Who stood at the front in each of the country's crises? The numbers answer for themselves.",
    milestones: [
      {
        id: "language",
        period: "1952",
        title: "Language Movement",
        stat: "100%",
        statLabel: "of the martyrs were men",
        body: "Every one of the martyrs who shed their blood on the streets to protect their mother tongue — Rafique, Barkat, Jabbar, Salam and others — was a man.",
      },
      {
        id: "liberation",
        period: "1971",
        title: "Liberation War",
        stat: "All 7",
        statLabel: "Bir Sreshtho recipients are men",
        body: "All seven recipients of Bangladesh's highest gallantry award, the Bir Sreshtho, are men. More than 95% of active frontline combatants and martyred freedom fighters were men.",
      },
      {
        id: "democracy",
        period: "Post-independence",
        title: "Democratic mass movements",
        stat: "Vast majority",
        statLabel: "of those killed were men",
        body: "Across every major political and democratic mass movement since independence — including those of Noor Hossain and Dr. Milon — the vast majority of casualties and martyrs were men.",
      },
      {
        id: "uprising",
        period: "2024",
        title: "Student-led mass uprising",
        stat: "≈ 98%",
        statLabel: "of martyrs, excluding women and children",
        body: "According to official government gazettes, of the 834 martyrs of the July–August uprising, 135 were children and 10–11 were women. Excluding women and children, roughly 98% of the martyrs were men.",
      },
    ],
  },
  inception: {
    eyebrow: "The legal void",
    title: "A legal void, and the foundation's inception",
    paragraphs: [
      "While rigorous laws, dedicated government ministries and numerous NGOs exist to protect women, there is no corresponding institutional framework — no 'Ministry for Men' — to provide legal and psychological support to male victims of abuse. That vacuum leaves men exposed to false accusations, severe social stigma and sustained harassment.",
      "The organisation grew out of the personal efforts of dedicated men's rights activists from around 2013–14, working to bridge that legal and social gap. After years of grassroots activity, it received formal legal recognition and registration under the Societies Registration Act.",
    ],
    void: {
      title: "The institutional void",
      women: {
        label: "For women",
        value:
          "Dedicated, rigorous laws, several government ministries and many NGOs.",
      },
      men: {
        label: "For men",
        value:
          "No ministry, and no institutional framework for legal or psychological support.",
      },
    },
    credential: {
      title: "Legal recognition and registration",
      rows: [
        {
          label: "Registering authority",
          value:
            "Registrar of Joint Stock Companies and Firms (RJSC), Ministry of Commerce, Government of the People's Republic of Bangladesh",
        },
        { label: "Statute", value: "Societies Registration Act, XXI of 1860" },
        { label: "Registration no.", value: "S-13304/2020" },
        { label: "Date of registration", value: "23 January 2020" },
      ],
    },
  },
  mission: {
    eyebrow: "Mission and objectives",
    title: "What we set out to do",
    description:
      "Operating entirely without government or international funding, the Aid for Men Foundation continues its work against the dual standards of society and the system.",
    objectives: [
      {
        id: "legal",
        title: "Legal protection",
        body: "Ensuring legal protection and fundamental human rights for men.",
      },
      {
        id: "litigation",
        title: "Help with false cases",
        body: "Providing legal assistance to men facing false and harassing litigation.",
      },
      {
        id: "equity",
        title: "An equitable society",
        body: "Eradicating family and social bias to build a balanced, non-discriminatory society.",
      },
      {
        id: "awareness",
        title: "Public awareness",
        body: "Raising public awareness of men's rights and of abuse against men.",
      },
    ],
  },
  gallery: {
    eyebrow: "On the ground",
    title: "From the streets to the roundtable",
    description:
      "Human chains, rallies and roundtables — moments from our campaigns.",
  },
  cta: {
    title: "Join our community",
    body: "Register, take part in the conversation, and stand beside others when it matters.",
    primary: "Register",
    secondary: "Contact us",
  },
  photos: {
    rally: {
      alt: "Participants marching with banners and balloons on International Men's Day 2020",
      caption: "Rally marking International Men's Day 2020, Dhaka.",
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
    acidProtest: {
      alt: "Participants standing at the roadside holding banners in a human chain",
      caption:
        "Human chain demanding justice for the acid attack on pilot Parvez Sanjari.",
    },
  },
};

const content: Record<Locale, AboutContent> = { bn, en };

export function getAboutContent(locale: Locale): AboutContent {
  return content[locale] ?? content.bn;
}
