import type { Locale } from "@/lib/i18n/config";

/**
 * The homepage "About" essay — "Relevance and Reality of Men's Rights in
 * Bangladesh" — supplied by the foundation as a Google Doc and kept here as
 * structured text so it renders as real headings, paragraphs and lists.
 *
 * Bengali is the source; the English follows it section for section.
 */

export type AboutDocBlock =
  | { type: "p"; text: string; label?: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: { label: string; text: string }[] };

export type AboutDocSection = { heading: string; blocks: AboutDocBlock[] };

export type HomeAboutDoc = {
  sections: AboutDocSection[];
  /** Shown beside the opening paragraph while the essay is collapsed. */
  journey: string;
};

const bnFoundation =
  "বাংলাদেশের পুরুষ অধিকার রক্ষায় আন্দোলনরত এমনই এক অগ্রগামী ও শীর্ষস্থানীয় স্বেচ্ছাসেবী সংগঠন হলো ‘এইড ফর মেন ফাউন্ডেশন’ (Aid for Men Foundation - AMF)। ২০০০ সালে কঠোর বিধান রেখে ‘নারী ও শিশু নির্যাতন দমন আইন’ প্রণয়ন করার পরপরই পারিবারিক শত্রুতা ও ব্যক্তিগত স্বার্থে এর অপপ্রয়োগ শুরু হয়, যা ২০০৫ থেকে ২০১০ সালের মধ্যে ভয়াবহ আকার ধারণ করে। এ সময় বহু নির্দোষ পুরুষ ও তাঁদের পরিবার মিথ্যা মামলার শিকার হয়ে চরম হয়রানির মুখে পড়েন। মূলধারার গণমাধ্যম পুরুষ নির্যাতনের এই ঘটনাগুলোকে ধারাবাহিকভাবে এড়িয়ে যাওয়ায় বিষয়টি দীর্ঘকাল আড়ালেই থেকে যায়। ২০১৩-১৪ সালের দিকে পুরুষ অধিকার কর্মীদের ছোট ছোট পরিসরে সংগঠিত হওয়ার চেষ্টার মধ্য দিয়ে এই সংগঠনের ভিত্তি তৈরি হয়।";

const enFoundation =
  "One of the pioneering and leading voluntary organizations fighting to protect men's rights in Bangladesh is the “Aid For Men Foundation” (AMF). Immediately after the enactment of the stringent “Prevention of Oppression Against Women and Children Act” in 2000, its misuse began for personal rivalries and private interests, which assumed alarming proportions between 2005 and 2010. During this time, numerous innocent men and their families fell victim to false cases and faced extreme harassment. As mainstream media consistently bypassed these incidents of violence against men, the issue remained concealed for a long time. The foundation of this organization was laid around 2013-2014 through the efforts of men's rights activists to organize on a small scale.";

const bn: HomeAboutDoc = {
  journey: bnFoundation,
  sections: [
    {
      heading: "বাংলাদেশে পুরুষ অধিকারের প্রাসঙ্গিকতা ও বাস্তবতা",
      blocks: [
        {
          type: "p",
          text: "যে বাংলাদেশের জন্ম হয়েছিল বৈষম্য, নিপীড়ন এবং শোষণের বিরুদ্ধে এক রক্তক্ষয়ী সংগ্রামের মধ্য দিয়ে, আজ সেই স্বাধীন দেশেই পুরুষেরা প্রতিনিয়ত এক অদৃশ্য ও প্রাতিষ্ঠানিক বৈষম্যের শিকার হচ্ছেন। বর্তমান সামাজিক, আইনি ও রাষ্ট্রীয় দৃষ্টিভঙ্গি এমন এক জায়গায় এসে দাঁড়িয়েছে, যেখানে সমাজের সকল সামাজিক অবক্ষয় ও পারিবারিক অপকর্মের একতরফা দায়ভার কেবল পুরুষের কাঁধেই চাপিয়ে দেওয়া হচ্ছে। এর ফলে ভেঙে পড়ছে আমাদের হাজার বছরের ঐতিহ্যের পারিবারিক সংহতি।",
        },
        {
          type: "p",
          text: "সমাজে নির্যাতন বা নিপীড়ন কখনো লিঙ্গ দেখে আসে না; পুরুষ ও নারী উভয়ই নানাভাবে নির্যাতনের শিকার হতে পারেন। কিন্তু দুঃখজনকভাবে বর্তমান শাসন ও বিচারিক কাঠামোতে কেবল নারী নির্যাতনের বিষয়টিকেই একচেটিয়াভাবে স্বীকার করা হয়, সম্পূর্ণ আড়াল করে রাখা হয় পুরুষ নির্যাতনের নির্মম বাস্তবতাকে। প্রচলিত আইনি ও সামাজিক বয়ান এমনভাবে তৈরি করা হয়েছে, যেন নির্যাতন কেবল পুরুষই করতে পারে, আর নারী কেবলই নির্যাতনের শিকার। অথচ বাস্তবতা হলো, নারীও যে কাউকে শারীরিকভাবে, মানসিকভাবে, সামাজিকভাবে কিংবা আইনি ফাঁদ ব্যবহার করে নির্যাতন করতে পারে—এই সত্যটিকে আজ সমাজ বা রাষ্ট্র কোনোভাবেই স্বীকার করতে চাইছে না।",
        },
      ],
    },
    {
      heading: "ইতিহাসের পাতায় পুরুষের মহোত্তম আত্মত্যাগ ও পরিসংখ্যান",
      blocks: [
        {
          type: "p",
          text: "আমরা নারী ও পুরুষের সমভাগীদারিত্বকে অস্বীকার করছি না, তবে ঐতিহাসিকভাবে রাষ্ট্র গঠন, স্বাধীনতা অর্জন এবং যেকোনো জাতীয় সংকটে পুরুষরা সবসময় অগ্রগামী ভূমিকা পালন করেছেন এবং সর্বোচ্চ আত্মত্যাগ স্বীকার করেছেন। উপমহাদেশের ইতিহাসের দিকে তাকালেই দেখা যায়, বর্তমান বাংলাদেশের স্বাধীন অস্তিত্বের ভিত্তিপ্রস্তর স্থাপিত হয়েছিল যে ব্রিটিশবিরোধী আন্দোলনের মাধ্যমে, সেখানে হাজার হাজার পুরুষের রক্ত ও আত্মত্যাগ ছিল সর্বাগ্রে। ব্রিটিশ আন্দোলন থেকে শুরু করে পাকিস্তান রাষ্ট্র তৈরি ও পরবর্তী স্বাধিকার আন্দোলন—প্রতিটি স্তরেই পুরুষেরা বুকের তাজা রক্ত দিয়ে ত্যাগের অনন্য নজির স্থাপন করেছেন।",
        },
        {
          type: "list",
          items: [
            {
              label: "১৯৫২ সালের ভাষা আন্দোলন",
              text: "মাতৃভাষার মর্যাদা রক্ষায় রাজপথে যাঁরা বুকের রক্ত ঢেলে দিয়েছিলেন, সেই ভাষা শহীদদের ইতিহাসে যাঁদের নাম পাওয়া যায় (রফিক, শফিক, বরকত, জব্বার, সালামসহ অন্যান্য), তাঁদের শতভাগই ছিলেন পুরুষ।",
            },
            {
              label: "১৯৭১ সালের মহান মুক্তিযুদ্ধ",
              text: "বাংলাদেশের স্বাধীনতার সর্বোচ্চ সম্মাননাপ্রাপ্ত ৭ জন বীরশ্রেষ্ঠের সকলেই পুরুষ। সশস্ত্র যুদ্ধক্ষেত্রে সম্মুখ সমরে অংশ নেওয়া এবং শহীদ হওয়া মুক্তিযোদ্ধাদের ৯৫ শতাংশেরও বেশি ছিলেন পুরুষ।",
            },
            {
              label: "স্বৈরাচার ও গণতান্ত্রিক আন্দোলন",
              text: "স্বাধীনতা-উত্তর বাংলাদেশে নূর হোসেন, ডা. মিলনসহ যতগুলো প্রধান রাজনৈতিক ও গণতান্ত্রিক গণআন্দোলন হয়েছে, সেখানে নিহতদের সিংহভাগই ছিলেন পুরুষ।",
            },
            {
              label: "২০২৪ সালের ছাত্র-জনতার গণঅভ্যুত্থান",
              text: "সর্বশেষ সরকারি গেজেট ও পরিসংখ্যান অনুযায়ী, ২০২৪ সালের জুলাই-আগস্টের গণঅভ্যুত্থানে শহীদের সংখ্যা ৮৩৪ জন। এর মধ্যে শিশু ১৩৫ জন এবং নারী ১০ থেকে ১১ জন। অর্থাৎ, নারী ও শিশু বাদে বাকি প্রায় ৯৮ শতাংশ শহীদই ছিলেন পুরুষ।",
            },
          ],
        },
      ],
    },
    {
      heading: "অধিকার ও সুবিধা বণ্টনে চরম বৈপরীত্য: পুরুষ যখন কোণঠাসা",
      blocks: [
        {
          type: "p",
          text: "এই সুনির্দিষ্ট ও নির্ভুল ঐতিহাসিক এবং বর্তমান পরিসংখ্যানগুলোই প্রমাণ করে যে, চব্বিশের গণঅভ্যুত্থান থেকে শুরু করে এই দেশের মাটি, ভাষা এবং স্বাধীনতা রক্ষায় পুরুষেরা সবসময় রাজপথে বুক পেতে দিয়েছেন এবং নিজেদের জীবন বিলিয়ে দিতে কুণ্ঠাবোধ করেননি।",
        },
        {
          type: "p",
          text: "তবে চরম ও নির্মম বাস্তবতা হলো—যখনই কোনো অধিকার অর্জন বা রাষ্ট্র পরিবর্তনের জন্য আত্মত্যাগের প্রয়োজন হয়, তখন পুরুষই থাকে অবিকল্প সম্মুখসারিতে; কিন্তু সেই অর্জনের পর যখন রাষ্ট্রীয় সুযোগ-সুবিধা, অগ্রাধিকার কিংবা পুনর্বাসনের সময় আসে, তখন পুরুষকে করা হয় চরমভাবে কোণঠাসা ও সুবিধাবঞ্চিত। সংকট ও ত্যাগের মুহূর্তে রাষ্ট্রের প্রয়োজন কেবল পুরুষের রক্ত ও হাড়ভাঙা শ্রম, অথচ সুবিধা বণ্টনের সময় একপেশে নীতি প্রণয়ন করে পুরুষকে বঞ্চিত করা হয়। চাকরি, আইনের বিচার কিংবা রাষ্ট্রীয় অধিকার—যেকোনো ক্ষেত্রে পুরুষের রক্ত-ঘাম শোষণ করা হলেও সুবিধার বেলায় রাষ্ট্র নারীকে ‘এক্সট্রা প্রিভিলেজ’ বা বিশেষ সুবিধা প্রদান করে। রাষ্ট্রের সকল নীতিমালাই মূলত নারীকেন্দ্রিক সুবিধা দিয়ে গঠিত, যেখানে পুরুষের ত্যাগ চিরকাল উপেক্ষিত।",
        },
        {
          type: "p",
          text: "রাষ্ট্রীয় নীতি, আইন ও সুযোগ-সুবিধা বণ্টনে পুরুষের প্রতি চলমান চরম বৈষম্যগুলোর সারসংক্ষেপ নিচে তুলে ধরা হলো:",
        },
        { type: "subheading", text: "১. আইনি ও বিচারিক বৈষম্য (একতরফা সুবিধা ও বিচারহীনতা)" },
        {
          type: "list",
          items: [
            {
              label: "আইনের একপেশে প্রয়োগ",
              text: "প্রচলিত দণ্ডবিধি এবং বিশেষ আইনগুলোতে (যেমন: নারী ও শিশু নির্যাতন দমন আইন) অপরাধের সংজ্ঞা ও শাস্তির বিধান এমনভাবে তৈরি করা হয়েছে, যা কেবল পুরুষকে অপরাধী হিসেবে সাব্যস্ত করে। নারীদের দ্বারা সংঘটিত কোনো অপরাধ বা নির্যাতনের ক্ষেত্রে সমপর্যায়ের শাস্তির বিধান নেই।",
            },
            {
              label: "মিথ্যা মামলার বিচারহীনতা",
              text: "দেনমোহর, যৌতুক কিংবা নারী নির্যাতনের অজুহাতে হাজার হাজার পুরুষ মিথ্যা ও হয়রানিমূলক মামলার শিকার হচ্ছেন। কোনো পুরুষ যখন এই ধরনের মিথ্যা মামলার মাধ্যমে নিঃস্ব ও সামাজিকভাবে অপদস্থ হন, তখন অপরাধী নারীর বিরুদ্ধে কঠোর আইনি ব্যবস্থা বা শাস্তির কোনো নজির দেখা যায় না বললেই চলে। পুরুষদের জন্য কোনো আইনি সুরক্ষাকবচ “Legal Shield” রাষ্ট্র রাখেনি।",
            },
          ],
        },
        { type: "subheading", text: "২. রাষ্ট্রীয় নীতি ও সুযোগ-সুবিধার বৈষম্য" },
        {
          type: "list",
          items: [
            {
              label: "আর্থিক ও প্রাতিষ্ঠানিক সুবিধা",
              text: "ক্ষুদ্রঋণ, সরকারি অনুদান, কর রেয়াত এবং ব্যাংক লোন বা ব্যবসায়িক লাইসেন্স পাওয়ার ক্ষেত্রে নারীদের জন্য বিশেষ ছাড় ও অগ্রাধিকার নীতি রয়েছে। অন্যদিকে, পুরুষকে করের পূর্ণ বোঝা বহনের পাশাপাশি কঠিন শর্তের মুখোমুখি হতে হয়, যদিও পরিবারের মূল উপার্জনকারী হিসেবে তাকেই সব দায়িত্ব সামলাতে হয়।",
            },
            {
              label: "সামাজিক নিরাপত্তা বেষ্টনী",
              text: "সরকারের সমাজকল্যাণমূলক বিভিন্ন ভাতা ও কর্মসূচির (যেমন: বিধবা ভাতা, স্বামী নিগৃহীতা ভাতা, প্রসূতি কল্যাণ স্কিম) প্রায় পুরোটাই নারীকেন্দ্রিক। অথচ বয়োবৃদ্ধ বা অসহায় নির্যাতিত পুরুষদের জন্য রাষ্ট্রীয় কোনো সামাজিক ভাতা বা পুনর্বাসন কেন্দ্র গড়ে তোলা হয়নি।",
            },
          ],
        },
        { type: "subheading", text: "৩. শিক্ষাক্ষেত্র ও কর্মসংস্থানে বৈষম্য" },
        {
          type: "list",
          items: [
            {
              label: "বিনামূল্যে শিক্ষার বৈষম্য",
              text: "রাষ্ট্র নারীদের শিক্ষাকে সম্পূর্ণ বিনামূল্যে করার জন্য একের পর এক বিশেষ স্কিম ও উপবৃত্তি চালু করছে। অথচ সমভাবে দরিদ্র ও যোগ্য হওয়া সত্ত্বেও পুরুষের জন্য শিক্ষাকে বিনামূল্যে করার কোনো রাষ্ট্রীয় উদ্যোগ নেই; প্রতিটি স্তরে সম্পূর্ণ ফি বা পেমেন্ট দিয়েই তাকে পড়াশোনা চালিয়ে যেতে হচ্ছে।",
            },
            {
              label: "চাকরি ক্ষেত্রে কোটানীতি",
              text: "মেধার ভিত্তিতে সমান সুযোগ সৃষ্টির পরিবর্তে চাকরি ক্ষেত্রে নারীদের জন্য বিশেষ কোটা ব্যবস্থা বহাল রাখার নানাবিধ রাষ্ট্রীয় প্রয়াস রয়েছে, যা পুরুষের মৌলিক কর্মসংস্থানের সুযোগকে সরাসরি সংকুচিত করছে। অপরদিকে মজার বিষয় হচ্ছে আইনি ও পারিবারিক কাঠামোর দিক থেকে পরিবার পরিচালনার সম্পূর্ণ আর্থিক দায়িত্ব কেবল পুরুষের ওপরই ন্যস্ত করা হয়েছে। এর ফলে নারীরা যেখানেই চাকরি বা আয় করুন না কেন, পারিবারিক ভরণপোষণের ক্ষেত্রে তাদের কোনো আইনগত বাধ্যবাধকতা বা আর্থিক দায়বদ্ধতা থাকছে না—যা এক ধরনের বৈষম্যমূলক পরিস্থিতি তৈরি করছে।",
            },
          ],
        },
      ],
    },
    {
      heading: "রাষ্ট্র গঠন ও অর্থনৈতিক মেরুদণ্ড গঠনে পুরুষের শ্রম",
      blocks: [
        {
          type: "p",
          text: "কেবল যুদ্ধক্ষেত্র বা রাজপথের আন্দোলনই নয়, স্বাধীন বাংলাদেশকে অর্থনৈতিকভাবে সচল রাখতে পুরুষেরা দিনরাত মাথার ঘাম পায়ে ফেলে কঠোর পরিশ্রম করছেন। দেশের পোশাক খাত, রেমিট্যান্স যোদ্ধা, প্রবাসী শ্রমিক, কৃষি খাত এবং ভারী শিল্পসহ অর্থনীতির মূল চালিকাশক্তিগুলোতে পুরুষ শ্রমিকদের অবদান অনস্বীকার্য। রাষ্ট্রকে অর্থনৈতিক ও অবকাঠামোগতভাবে টিকিয়ে রাখতে পুরুষরা যে হাড়ভাঙা খাটুনি খাটছেন, তার বিপরীতে আজ তাঁরাই রাষ্ট্র ও সমাজের কাছ থেকে চরম অবহেলা ও আইনি বৈষম্য উপহার পাচ্ছেন।",
        },
      ],
    },
    {
      heading: "আইনি ও প্রাতিষ্ঠানিক চরম শূন্যতা",
      blocks: [
        {
          type: "p",
          text: "বর্তমানে নারী নির্যাতনের বিরুদ্ধে দেশে অত্যন্ত কঠোর ও সুনির্দিষ্ট আইন রয়েছে, যা প্রশংসনীয়। কিন্তু চরম উদ্বেগের বিষয় হলো, পুরুষ নির্যাতনের বিরুদ্ধে বাংলাদেশে সুনির্দিষ্ট কোনো আইনই নেই। নারী নির্যাতন নিয়ে নিয়মিত প্রতিবেদন, জরিপ, গবেষণা এবং নির্যাতিত নারীদের বা শিশুদের তাৎক্ষণিক সহায়তার জন্য রাষ্ট্রীয়ভাবে ‘নারী ও শিশু বিষয়ক মন্ত্রণালয়’ রয়েছে। এর পাশাপাশি গড়ে উঠেছে শত শত দেশি-বিদেশি এনজিও ও মানবাধিকার সংগঠন। অথচ পুরুষ নির্যাতন নিয়ে গবেষণা, জরিপ বা নির্যাতিত পুরুষদের আইনি ও মানসিক সহায়তা দেওয়ার জন্য কোনো ‘পুরুষ বিষয়ক মন্ত্রণালয়’ নেই, নেই কোনো উল্লেখযোগ্য এনজিও। প্রাতিষ্ঠানিক গবেষণা ও গণমাধ্যমে সঠিক প্রতিবেদন না থাকার কারণে পুরুষ নির্যাতনের ভয়াবহতা এবং এর প্রকৃত মাত্রা জনসাধারণের সামনে আসছে না। ফলে এই বিষয়ে সমাজে কোনো সচেতনতাও তৈরি হচ্ছে না। উল্টো অনেক ক্ষেত্রে পুরুষেরা মিথ্যা মামলার ফাঁদে পড়ে সামাজিকভাবে হেনস্তা হচ্ছেন, ঘরছাড়া হচ্ছেন এবং নানাভাবে হয়রানির শিকার হয়ে শেষ পর্যন্ত আত্মহত্যার পথ বেছে নিতে বাধ্য হচ্ছেন।",
        },
      ],
    },
    {
      heading: "অধিকার আদায়ের লড়াই ও ‘এইড ফর মেন ফাউন্ডেশন’ (AMF)",
      blocks: [
        {
          type: "p",
          text: "এই চরম আইনি ও সামাজিক বৈষম্যের অন্ধকার ভেদ করে বর্তমানে পুরুষের সম্মান, অধিকার ও কল্যাণের আকাঙ্ক্ষায় বেসরকারিভাবে ও ব্যক্তি উদ্যোগে কিছু নিবেদিতপ্রাণ পুরুষ অধিকার কর্মী ঐক্যবদ্ধ হয়েছেন। নানা বাধা-বিপত্তি পেরিয়ে তাঁরা পুরুষদের অধিকার রক্ষায় কাজ করে যাচ্ছেন।",
        },
        { type: "p", text: bnFoundation },
        {
          type: "p",
          label: "আইনি স্বীকৃতি ও নিবন্ধন",
          text: "দীর্ঘদিন মাঠপর্যায়ে কার্যক্রম পরিচালনার পর, ২০২০ সালের ২৩ জানুয়ারি প্রতিষ্ঠানটি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের বাণিজ্য মন্ত্রণালয়ের অধীন (RJSC) থেকে সোসাইটি রেজিস্ট্রেশন অ্যাক্টের আওতায় আনুষ্ঠানিকভাবে আইনি স্বীকৃতি ও নিবন্ধন সনদপত্র লাভ করে [Under Societies Registration Act, XXI of 1860, Reg. No. S-13304/2020]। এর মাধ্যমে সংগঠনটি সমাজে পুরুষ অধিকার রক্ষায় কাজ করার একটি সুনির্দিষ্ট আইনি ও প্রাতিষ্ঠানিক ভিত্তি লাভ করে।",
        },
        {
          type: "p",
          text: "নারীবাদী সংগঠনগুলো যেখানে সরকারি, আন্তর্জাতিক এবং অভ্যন্তরীণ বিভিন্ন উৎস থেকে বিপুল পরিমাণ অর্থনৈতিক সহায়তা, ফান্ড ও পৃষ্ঠপোষকতা পেয়ে থাকে; সেখানে ‘এইড ফর মেন ফাউন্ডেশন’ বা পুরুষ অধিকার রক্ষা সংস্থাগুলোর চিত্র সম্পূর্ণ বিপরীত। তারা কোনো প্রকার সরকারি বা আন্তর্জাতিক আর্থিক সহযোগিতা পায় না। বরং সমাজ ও ব্যবস্থার দ্বিমুখী নীতির কারণে তাদের পথ চলা অত্যন্ত দুর্গম এবং পদে পদে তাদের নানা হয়রানি ও বাধার সম্মুখীন হতে হয়।",
        },
        {
          type: "p",
          text: "তবুও, সর্বস্তরের পুরুষের অধিকার প্রতিষ্ঠা, আইনি সমতা আনয়ন এবং একটি সুন্দর, বৈষম্যহীন ও ভারসাম্যপূর্ণ সমাজ গঠনের লক্ষ্যে ‘এইড ফর মেন ফাউন্ডেশন’-এর প্রতিষ্ঠাতা ও নিবেদিতপ্রাণ সদস্যরা নিরলসভাবে কাজ করে যাচ্ছেন। এই ভূমিকা মূলত সেই অধিকার আদায়ের লড়াইয়ের একটি আনুষ্ঠানিক দলিল।",
        },
      ],
    },
  ],
};

const en: HomeAboutDoc = {
  journey: enFoundation,
  sections: [
    {
      heading: "Relevance and Reality of Men's Rights in Bangladesh",
      blocks: [
        {
          type: "p",
          text: "The Bangladesh that was born through a bloody struggle against discrimination, oppression, and exploitation is the very same independent country where men are constantly facing invisible and institutional discrimination. The current social, legal, and state perspective has reached a point where the sole blame for all social degradation and family wrongdoings is placed entirely on the shoulders of men. As a result, the family solidarity of our millennia-old heritage is collapsing.",
        },
        {
          type: "p",
          text: "Abuse or oppression in society does not come by looking at gender; both men and women can be victims of abuse in various ways. However, regrettably, the current governance and judicial framework exclusively recognizes the issue of violence against women while completely concealing the grim reality of violence against men. The prevailing legal and social narrative has been constructed in such a way as if only men can be perpetrators and women can only be victims. Yet the reality is that women can also abuse anyone physically, mentally, socially, or by utilizing legal traps—a truth that society or the state is simply unwilling to acknowledge.",
        },
      ],
    },
    {
      heading: "The Supreme Sacrifice and Statistics of Men in History",
      blocks: [
        {
          type: "p",
          text: "We are not denying the equal partnership of men and women, but historically, men have always played a pioneering role and made the supreme sacrifice in nation-building, achieving independence, and during any national crisis. Looking at the history of the subcontinent, the foundational base of Bangladesh's current independent existence was established through the anti-British movement, where the blood and sacrifices of thousands of men were at the forefront. From the British movement to the creation of the Pakistan state and subsequent autonomy movements, men at every stage set unique examples of sacrifice by shedding their fresh blood:",
        },
        {
          type: "list",
          items: [
            {
              label: "The 1952 Language Movement",
              text: "Among those whose names are found in history as language martyrs who shed their blood on the streets to protect the dignity of their mother tongue (Rafiq, Shafiq, Barkat, Jabbar, Salam, and others), 100% were men.",
            },
            {
              label: "The Great Liberation War of 1971",
              text: "All 7 Bir Sreshtho, the highest gallantry award recipients of Bangladesh's independence, were men. More than 95% of the freedom fighters who participated in direct combat on the battlefield and were martyred were men.",
            },
            {
              label: "Autocracy and Democratic Movements",
              text: "In all major political and democratic mass movements in post-independence Bangladesh, such as Noor Hossain and Dr. Milon, the vast majority of those killed were men.",
            },
            {
              label: "The July-August Student-Citizen Mass Uprising of 2024",
              text: "According to the latest government gazette and statistics, the number of martyrs in the July-August uprising of 2024 is 834. Among them, 135 are children and 10 to 11 are women. This means that excluding women and children, nearly 98% of the remaining martyrs were men.",
            },
          ],
        },
      ],
    },
    {
      heading: "Extreme Contrast in Rights and Privilege Distribution: Men Cornered",
      blocks: [
        {
          type: "p",
          text: "These specific, accurate historical and current statistics prove that from the mass uprising of '24 to protecting the soil, language, and independence of this country, men have always bared their chests on the streets and never hesitated to lay down their lives.",
        },
        {
          type: "p",
          text: "However, the extreme and bitter reality is that whenever sacrifices are required for rights acquisition or state transformation, men are invariably at the frontline; but after those achievements, when it comes to state opportunities, priorities, or rehabilitation, men are pushed into extreme marginalization and deprivation. In moments of crisis and sacrifice, the state requires only the blood and bone-breaking labor of men, yet during the distribution of benefits, one-sided policies are formulated to deprive them. Whether in employment, judicial decisions, or state rights, men's blood and sweat are exploited, while in terms of benefits, the state grants women “extra privileges.” Essentially, all state policies are formulated with female-centric benefits, where men's sacrifices remain permanently ignored.",
        },
        {
          type: "p",
          text: "A summary of the ongoing extreme discriminations against men in state policies, laws, and the distribution of privileges is presented below:",
        },
        { type: "subheading", text: "1. Legal and Judicial Discrimination (One-Sided Benefits and Impunity)" },
        {
          type: "list",
          items: [
            {
              label: "One-Sided Application of Laws",
              text: "The definitions of offenses and penalty provisions in prevailing penal codes and special laws (such as the Prevention of Oppression Against Women and Children Act) are structured in a way that exclusively labels men as offenders. There are no equivalent penalty provisions for offenses or abuses committed by women.",
            },
            {
              label: "Impunity for False Cases",
              text: "Thousands of men fall victim to false and harassing lawsuits under the pretexts of dower (Denmohor), dowry, or oppression against women. When a man is ruined and socially disgraced through such false cases, there is hardly any precedent of strict legal action or punishment against the offending woman. The state has maintained no legal safeguards for men.",
            },
          ],
        },
        { type: "subheading", text: "2. Discrimination in State Policies and Privileges" },
        {
          type: "list",
          items: [
            {
              label: "Financial and Institutional Benefits",
              text: "There are special waiver and priority policies for women in microfinance, government grants, tax rebates, bank loans, or business licenses. On the other hand, men face stringent conditions alongside bearing the full burden of taxation, despite having to manage all responsibilities as the primary earners of their families.",
            },
            {
              label: "Social Safety Net",
              text: "Most of government welfare allowances and programs (such as allowances for widows, destitute wives, and maternity welfare schemes) are entirely female-centric. Yet, no state-funded social allowances or rehabilitation centers have been established for elderly or helpless abused men.",
            },
          ],
        },
        { type: "subheading", text: "3. Discrimination in Education and Employment" },
        {
          type: "list",
          items: [
            {
              label: "Discrimination in Free Education",
              text: "The state is rolling out special schemes and stipends one after another to make education completely free for women. Yet, despite being equally poor and qualified, there is no state initiative to make education free for men; they must continue their studies by paying full fees at every tier.",
            },
            {
              label: "Quota System in Employment",
              text: "Instead of creating equal opportunities based on merit, there are various state efforts to maintain special quota systems for women in employment, which directly restricts men's fundamental employment opportunities. On the other hand, interestingly, from the perspective of legal and family structures, the complete financial responsibility of running a family is cast solely upon men. Consequently, regardless of where women are employed or earning, they have no legal obligation or financial liability towards family maintenance—creating a discriminatory environment.",
            },
          ],
        },
      ],
    },
    {
      heading: "Men's Labor in State-Building and Economic Backbone",
      blocks: [
        {
          type: "p",
          text: "Not only in battlefields or street movements, but men are also toiling day and night with sweat on their brows to keep independent Bangladesh economically vibrant. The contributions of male workers in the country's apparel sector, remittance sector (expatriate workers), agricultural sector, and heavy industries as core economic drivers are undeniable. In return for the back-breaking labor men put in to sustain the state economically and infrastructurally, they are rewarded today with sheer neglect and legal discrimination by society and the state.",
        },
      ],
    },
    {
      heading: "Extreme Legal and Institutional Void",
      blocks: [
        {
          type: "p",
          text: "Currently, the country has very strict and specific laws against violence against women, which is commendable. However, the matter of grave concern is that Bangladesh has no specific laws whatsoever against violence against men. For regular reporting, surveys, research on violence against women, and immediate assistance to abused women and children, there is a state-level “Ministry of Women and Children Affairs.” Alongside this, hundreds of domestic and international NGOs and human rights organizations have emerged. Yet, there is no “Ministry of Men's Affairs” or any notable NGO for conducting research, surveys, or providing legal and psychological support to abused men. Due to the lack of institutional research and accurate media reporting, the severity and true magnitude of violence against men are not coming before the public. Consequently, no social awareness is being built around this issue. Conversely, in many cases, men fall into the traps of false cases, face social harassment, are driven out of their homes, and are ultimately forced to choose the path of suicide.",
        },
      ],
    },
    {
      heading: "The Struggle for Rights and the “Aid for Men Foundation” (AMF)",
      blocks: [
        {
          type: "p",
          text: "Piercing through the darkness of this extreme legal and social inequality, some dedicated men's rights activists have currently united through private and individual initiatives driven by aspirations for men's dignity, rights, and welfare. Overcoming numerous obstacles, they are working to protect men's rights.",
        },
        { type: "p", text: enFoundation },
        {
          type: "p",
          label: "Legal Recognition and Registration",
          text: "After long grassroots operations, the institution officially obtained legal recognition and a registration certificate under the Societies Registration Act from the Registrar of Joint Stock Companies and Firms (RJSC) under the Ministry of Commerce, Government of the People's Republic of Bangladesh, on January 23, 2020 (Under Societies Registration Act, XXI of 1860, Reg. No. S-13304/2020). Through this, the organization gained a specific legal and institutional foundation to work for the protection of men's rights in society.",
        },
        {
          type: "p",
          text: "While feminist organizations receive massive financial assistance, funds, and patronage from various governmental, international, and domestic sources, the picture for the “Aid For Men Foundation” or men's rights protection agencies is entirely the opposite. They receive no government or international financial support. Rather, due to the dual policies of society and the system, their journey is extremely rugged and fraught with various harassments and obstacles at every step.",
        },
        {
          type: "p",
          text: "Nonetheless, with the goal of establishing rights for men across all strata, bringing about legal equality, and building a beautiful, discrimination-free, and balanced society, the founder and dedicated members of the “Aid For Men Foundation” are working tirelessly. This role essentially serves as an official document of that struggle for rights.",
        },
      ],
    },
  ],
};

const docs: Record<Locale, HomeAboutDoc> = { bn, en };

export function getHomeAboutDoc(locale: Locale): HomeAboutDoc {
  return docs[locale];
}
