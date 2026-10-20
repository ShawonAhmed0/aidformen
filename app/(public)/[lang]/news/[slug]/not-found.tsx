import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function NewsItemNotFound() {
  return (
    <main className="flex min-h-[60dvh] items-center justify-center px-5 py-16 text-center">
      <div className="max-w-xl">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <FileQuestion className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl text-brand-900">সংবাদটি পাওয়া যায়নি</h1>
        <p className="mt-3 text-base text-ink-600">
          The requested news, press release or archive record is unavailable.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/bn/news" className={buttonVariants()}>
            নিউজ ও মিডিয়া সেন্টার
          </Link>
          <Link href="/en/news" className={buttonVariants({ variant: "outline" })}>
            News &amp; Media Center
          </Link>
        </div>
      </div>
    </main>
  );
}
