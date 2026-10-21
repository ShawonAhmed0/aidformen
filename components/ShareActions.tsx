"use client";

import { useState } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";

import { cn } from "@/lib/utils";

type ShareActionsProps = {
  title: string;
  locale: "bn" | "en";
  className?: string;
};

function currentUrl() {
  return window.location.href.split("#")[0];
}

function openShare(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=720,height=620");
}

/**
 * Small browser-only share toolbar for public articles.
 *
 * The URL is read at click time instead of being passed through the server so
 * preview deployments, language routes and canonical production URLs all work
 * without exposing request headers to a Client Component.
 */
export function ShareActions({ title, locale, className }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const labels =
    locale === "en"
      ? {
          share: "Share",
          native: "Share this page",
          copy: "Copy link",
          copied: "Link copied",
          print: "Print or save as PDF",
          facebook: "Share on Facebook",
          whatsapp: "Share on WhatsApp",
          linkedin: "Share on LinkedIn",
        }
      : {
          share: "শেয়ার করুন",
          native: "এই পেজটি শেয়ার করুন",
          copy: "লিঙ্ক কপি করুন",
          copied: "লিঙ্ক কপি হয়েছে",
          print: "প্রিন্ট বা PDF হিসেবে সংরক্ষণ",
          facebook: "Facebook-এ শেয়ার করুন",
          whatsapp: "WhatsApp-এ শেয়ার করুন",
          linkedin: "LinkedIn-এ শেয়ার করুন",
        };

  const copy = async () => {
    const url = currentUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      await copy();
      return;
    }

    try {
      await navigator.share({ title, url: currentUrl() });
    } catch (error) {
      if ((error as Error).name !== "AbortError") await copy();
    }
  };

  const social = (network: "facebook" | "whatsapp" | "linkedin") => {
    const url = encodeURIComponent(currentUrl());
    const text = encodeURIComponent(title);
    const destinations = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    openShare(destinations[network]);
  };

  const buttonClass =
    "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-sm px-2 text-sm font-semibold text-ink-700 transition-ui hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:px-2.5";

  return (
    <div
      data-print-hide
      className={cn(
        "flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain sm:flex-wrap sm:overflow-visible",
        className,
      )}
      aria-label={labels.share}
    >
      <button
        type="button"
        onClick={() => void nativeShare()}
        className={buttonClass}
      >
        <Share2 className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{labels.share}</span>
      </button>

      <button
        type="button"
        onClick={() => social("facebook")}
        className={buttonClass}
        aria-label={labels.facebook}
        title={labels.facebook}
      >
        <FaFacebookF className="size-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => social("whatsapp")}
        className={buttonClass}
        aria-label={labels.whatsapp}
        title={labels.whatsapp}
      >
        <FaWhatsapp className="size-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => social("linkedin")}
        className={buttonClass}
        aria-label={labels.linkedin}
        title={labels.linkedin}
      >
        <FaLinkedinIn className="size-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => void copy()}
        className={buttonClass}
        aria-label={copied ? labels.copied : labels.copy}
        title={copied ? labels.copied : labels.copy}
      >
        {copied ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only sm:not-sr-only">
          {copied ? labels.copied : labels.copy}
        </span>
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className={buttonClass}
        aria-label={labels.print}
        title={labels.print}
      >
        <Printer className="size-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{labels.print}</span>
      </button>
    </div>
  );
}
