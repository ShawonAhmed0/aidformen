import type { Locale } from "@/lib/i18n/config";

export type MediaLibraryLabels = {
  eyebrow: string;
  title: string;
  description: string;
  imageTab: string;
  videoTab: string;
  imageCollection: string;
  videoCollection: string;
  emptyImages: string;
  emptyVideos: string;
  imageAltPrefix: string;
  imagePreviewUnavailable: string;
  videoLabelPrefix: string;
  videoFallback: string;
  playbackUnavailable: string;
  openOriginal: string;
  download: string;
  itemCount: (count: string) => string;
};

const labels: Record<Locale, MediaLibraryLabels> = {
  bn: {
    eyebrow: "কেন্দ্রীয় মিডিয়া আর্কাইভ",
    title: "ছবি ও ভিডিও আর্কাইভ",
    description:
      "আমাদের কার্যক্রম, অনুষ্ঠান ও প্রকাশিত কনটেন্টে ব্যবহৃত ছবি এবং ভিডিও এক জায়গায় দেখুন।",
    imageTab: "ছবি",
    videoTab: "ভিডিও",
    imageCollection: "ছবির সংগ্রহ",
    videoCollection: "ভিডিওর সংগ্রহ",
    emptyImages: "এখনও কোনো ছবি আর্কাইভে যোগ হয়নি।",
    emptyVideos: "এখনও কোনো ভিডিও আর্কাইভে যোগ হয়নি।",
    imageAltPrefix: "আর্কাইভের ছবি",
    imagePreviewUnavailable: "এই ছবির ফরম্যাটটি ব্রাউজারে প্রিভিউ করা যাচ্ছে না।",
    videoLabelPrefix: "আর্কাইভের ভিডিও",
    videoFallback: "আপনার ব্রাউজার এই ভিডিওটি চালাতে পারছে না।",
    playbackUnavailable: "এই ফরম্যাটটি ব্রাউজারে সরাসরি চালানো নাও যেতে পারে।",
    openOriginal: "মূল ফাইল দেখুন",
    download: "ডাউনলোড",
    itemCount: (count) => `${count}টি`,
  },
  en: {
    eyebrow: "Central media archive",
    title: "Image and video archive",
    description:
      "Browse images and videos used across our activities, events and published content in one place.",
    imageTab: "Images",
    videoTab: "Videos",
    imageCollection: "Image collection",
    videoCollection: "Video collection",
    emptyImages: "No images have been added to the archive yet.",
    emptyVideos: "No videos have been added to the archive yet.",
    imageAltPrefix: "Archived image",
    imagePreviewUnavailable: "This image format cannot be previewed in the browser.",
    videoLabelPrefix: "Archived video",
    videoFallback: "Your browser cannot play this video.",
    playbackUnavailable: "This format may not play directly in your browser.",
    openOriginal: "View original",
    download: "Download",
    itemCount: (count) => `${count} ${count === "1" ? "item" : "items"}`,
  },
};

export function getMediaLibraryLabels(locale: Locale): MediaLibraryLabels {
  return labels[locale];
}
