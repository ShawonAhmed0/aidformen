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
  acidProtest: "/about-section/1603378398.jpg",
  humanChain: "/about-section/1605972841.jpg",
  roundtable: "/about-section/1603379355.jpg",
  seminar: "/about-section/1603375562.jpg",
} as const;

export type PhotoId = keyof typeof aboutPhotos;

type Photo = { alt: string; caption: string };

export type AboutContent = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string };
  intro: string[];
  history: { title: string; items: { term: string; detail: string }[] };
  inception: { title: string; paragraphs: string[] };
  mission: { title: string; intro: string; points: string[] };
  closing: string;
  photos: Record<PhotoId, Photo>;
};

const bn: AboutContent = {
  meta: {
    title: "আমাদের সম্পর্কে",
    description:
      "এইড ফর মেন ফাউন্ডেশন (AMF) — সমতা, ন্যায়বিচার ও মানবিক মর্যাদার ভিত্তিতে একটি সুস্থ পারিবারিক ও সামাজিক বন্ধন বিনির্মাণে প্রতিজ্ঞাবদ্ধ।",
  },
  hero: {
    eyebrow: "এইড ফর মেন ফাউন্ডেশন (AMF)",
    title: "আমাদের সম্পর্কে",
  },
  intro: [
    "স্বাধীন বাংলাদেশে সমাজ গঠন, স্বাধীনতা অর্জন এবং যেকোনো জাতীয় সংকটে পুরুষরা সবসময় অগ্রগামী ভূমিকা পালন করেছেন এবং সর্বোচ্চ আত্মত্যাগ স্বীকার করেছেন। ভাষা আন্দোলন, একাত্তরের মহান মুক্তিযুদ্ধ, গণতান্ত্রিক গণ-আন্দোলন থেকে শুরু করে ২০২৪ সালের ছাত্র-জনতার গণ-অভ্যুত্থান পর্যন্ত প্রতিটি ঐতিহাসিক অধ্যায়ে দেশের পুরুষেরা রাজপথে বুক পেতে দিয়েছেন এবং নিজেদের জীবন বিলিয়ে দিয়েছেন।",
    "কিন্তু অত্যন্ত দুঃখজনক হলেও সত্য যে, ত্যাগের সময় রাষ্ট্রের প্রয়োজন কেবল পুরুষের রক্ত ও হাড়ভাঙা শ্রম হলেও, অধিকার ও সুযোগ-সুবিধা বণ্টনের সময় পুরুষকে প্রতিনিয়ত কোণঠাসা ও সুবিধাবঞ্চিত রাখা হচ্ছে। বর্তমান আইনি ও সামাজিক কাঠামোতে কেবল নারী নির্যাতনের দিকটি একপেশেভাবে প্রচার করা হলেও পুরুষ নির্যাতনের নির্মম বাস্তবতা ও আইনি শূন্যতাকে সম্পূর্ণ আড়াল করে রাখা হয়েছে। মিথ্যা মামলা, পারিবারিক হয়রানি এবং আইনি সুরক্ষাকবচের অভাবে আজ সমাজের বহু পুরুষ নিঃস্ব ও কোণঠাসা জীবনযাপন করতে বাধ্য হচ্ছেন।",
  ],
  history: {
    title: "জাতীয় সংকটে পুরুষের ঐতিহাসিক অবদান",
    items: [
      {
        term: "১৯৫২ সালের ভাষা আন্দোলন",
        detail:
          "মায়ের ভাষার মর্যাদা রক্ষায় রাজপথে যাঁরা বুকের রক্ত ঢেলে দিয়েছিলেন (রফিক, বরকত, জব্বার, সালামসহ অন্যান্য), তাঁদের শতভাগই ছিলেন পুরুষ।",
      },
      {
        term: "১৯৭১ সালের মহান মুক্তিযুদ্ধ",
        detail:
          "বাংলাদেশের স্বাধীনতার সর্বোচ্চ সম্মাননাপ্রাপ্ত ৭ জন বীরশ্রেষ্ঠের সকলেই পুরুষ। সম্মুখ সমরে অংশ নেওয়া ও শহীদ মুক্তিযোদ্ধাদের ৯৫%-এর বেশি ছিলেন পুরুষ।",
      },
      {
        term: "গণতান্ত্রিক গণ-আন্দোলন",
        detail:
          "নূর হোসেন ও ডা. মিলনসহ স্বাধীনতা-উত্তর প্রতিটি প্রধান রাজনৈতিক ও গণতান্ত্রিক গণ-আন্দোলনে নিহতদের সিংহভাগই ছিলেন পুরুষ।",
      },
      {
        term: "২০২৪ সালের গণ-অভ্যুত্থান",
        detail:
          "সরকারি গেজেট অনুযায়ী ৮৩৪ জন শহীদের মধ্যে শিশু ১৩৫ জন এবং নারী ১০-১১ জন। নারী ও শিশু বাদে বাকি প্রায় ৯৮% শহীদই ছিলেন পুরুষ।",
      },
    ],
  },
  inception: {
    title: "আইনি শূন্যতা ও সংগঠনের আত্মপ্রকাশ",
    paragraphs: [
      "নারীদের সুরক্ষার জন্য দেশে সুনির্দিষ্ট ও কঠোর আইন এবং একাধিক রাষ্ট্রীয় মন্ত্রণালয় ও এনজিও থাকলেও, পুরুষ নির্যাতনের শিকার ব্যক্তিদের আইনি ও মানসিক সহায়তা দেওয়ার মতো কোনো প্রাতিষ্ঠানিক ব্যবস্থা বা ‘পুরুষ বিষয়ক মন্ত্রণালয়’ নেই। এই প্রাতিষ্ঠানিক শূন্যতার কারণে পুরুষরা মিথ্যা মামলার শিকার হয়ে সামাজিকভাবে অপদস্থ হচ্ছেন এবং নানা হয়রানির মুখোমুখি হচ্ছেন।",
      "এই চরম আইনি ও সামাজিক বৈষম্যের অন্ধকার ভেদ করে ২০১৩-১৪ সাল থেকে নিবেদিতপ্রাণ পুরুষ অধিকার কর্মীদের ব্যক্তিগত প্রচেষ্টার মধ্য দিয়ে এই সংগঠনের ভিত্তি তৈরি হয়। দীর্ঘ মাঠপর্যায়ে কার্যক্রম পরিচালনার পর, ২০২০ সালের ২৩ জানুয়ারি প্রতিষ্ঠানটি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের বাণিজ্য মন্ত্রণালয়ের অধীন (RJSC) থেকে সোসাইটি রেজিস্ট্রেশন অ্যাক্টের আওতায় আনুষ্ঠানিকভাবে আইনি স্বীকৃতি ও নিবন্ধন লাভ করে [Reg. No. S-13304/2020]।",
    ],
  },
  mission: {
    title: "আমাদের লক্ষ্য ও উদ্দেশ্য",
    intro:
      "যেকোনো প্রকার সরকারি বা আন্তর্জাতিক আর্থিক সহযোগিতা ছাড়াই, কেবল সমাজ ও ব্যবস্থার দ্বিমুখী নীতি মোকাবেলা করে ‘এইড ফর মেন ফাউন্ডেশন’ নিরলসভাবে কাজ করে যাচ্ছে। আমাদের মূল লক্ষ্য ও কর্মপরিধি হলো:",
    points: [
      "পুরুষের আইনি সুরক্ষা ও মানবাধিকার নিশ্চিত করা।",
      "মিথ্যা ও হয়রানিমূলক মামলার শিকার পুরুষদের আইনি সহায়তা প্রদান।",
      "পারিবারিক ও সামাজিক বৈষম্য দূর করে একটি ভারসাম্যপূর্ণ ও বৈষম্যহীন সমাজ গঠন।",
      "পুরুষ নির্যাতন ও অধিকার নিয়ে সচেতনতা বৃদ্ধি করা।",
    ],
  },
  closing:
    "এইড ফর মেন ফাউন্ডেশন (AMF) — সমতা, ন্যায়বিচার ও মানবিক মর্যাদার ভিত্তিতে একটি সুস্থ পারিবারিক ও সামাজিক বন্ধন বিনির্মাণে প্রতিজ্ঞাবদ্ধ।",
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
    description:
      "Aid for Men Foundation (AMF) — committed to building healthy family and social bonds founded on equality, justice and human dignity.",
  },
  hero: {
    eyebrow: "Aid for Men Foundation (AMF)",
    title: "About us",
  },
  intro: [
    "Throughout independent Bangladesh — in building society, in winning independence, and in every national crisis — men have always played the leading role and made the greatest sacrifices. From the Language Movement and the great Liberation War of 1971 to the democratic mass movements and the student-led mass uprising of 2024, in every historic chapter the men of this country have stood in the streets and given their lives.",
    "Yet it is a painful truth that while the state needs only men's blood and back-breaking labour in the hour of sacrifice, men are constantly cornered and deprived when rights and privileges are distributed. In the present legal and social framework, only violence against women is publicised, and one-sidedly at that, while the brutal reality of violence against men and the legal void around it is kept entirely out of sight. Because of false cases, family harassment and the absence of legal safeguards, many men in our society today are forced to live destitute and cornered lives.",
  ],
  history: {
    title: "Men's historic contribution in national crises",
    items: [
      {
        term: "The Language Movement of 1952",
        detail:
          "Every one of those who shed their blood on the streets to defend the dignity of the mother tongue — Rafiq, Barkat, Jabbar, Salam and others — was a man.",
      },
      {
        term: "The great Liberation War of 1971",
        detail:
          "All seven recipients of the Bir Sreshtho, the highest honour of Bangladesh's independence, are men. More than 95% of those who fought on the front line, and of the martyred freedom fighters, were men.",
      },
      {
        term: "The democratic mass movements",
        detail:
          "In every major political and democratic mass movement since independence — including those of Noor Hossain and Dr. Milon — the vast majority of those killed were men.",
      },
      {
        term: "The mass uprising of 2024",
        detail:
          "According to the government gazette, of the 834 martyrs, 135 were children and 10–11 were women. Excluding women and children, nearly 98% of the martyrs were men.",
      },
    ],
  },
  inception: {
    title: "The legal void, and the founding of the organisation",
    paragraphs: [
      "Although the country has specific and stringent laws to protect women, along with several state ministries and NGOs, there is no institutional arrangement — and no 'Ministry for Men's Affairs' — to provide legal and psychological support to men who are victims of abuse. Because of this institutional void, men who fall victim to false cases are shamed socially and face harassment of many kinds.",
      "Breaking through the darkness of this extreme legal and social discrimination, the foundations of this organisation were laid from 2013–14 through the personal efforts of dedicated men's rights activists. After a long period of work at the grassroots, on 23 January 2020 it received formal legal recognition and registration under the Societies Registration Act from the Registrar of Joint Stock Companies and Firms (RJSC), under the Ministry of Commerce of the Government of the People's Republic of Bangladesh [Reg. No. S-13304/2020].",
    ],
  },
  mission: {
    title: "Our aims and objectives",
    intro:
      "Without any government or international financial support, and facing only the double standards of society and the system, the Aid for Men Foundation carries on its work tirelessly. Our core aims and scope of work are:",
    points: [
      "Ensuring legal protection and human rights for men.",
      "Providing legal assistance to men who are victims of false and harassing litigation.",
      "Removing family and social discrimination to build a balanced, non-discriminatory society.",
      "Raising awareness about violence against men and about men's rights.",
    ],
  },
  closing:
    "Aid for Men Foundation (AMF) — committed to building healthy family and social bonds founded on equality, justice and human dignity.",
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
