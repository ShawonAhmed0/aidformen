"use client";

import { useState } from "react";
import { Check, Copy, Printer, Share2 } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";

import { cn } from "@/lib/utils";

type ShareActionsProps = {
  title: string;
  locale: "bn" | "en";
  /**
   * What to share, as a path ("/en?about=full#about") resolved against the
   * current origin at click time. Defaults to the page itself, minus its hash.
   */
  url?: string;
  /**
   * Prints only part of the page: set on <html> as data-print-scope for the
   * duration of the print, where globals.css hides everything outside it.
   */
  printScope?: string;
  /**
   * Icons only, in round buttons — for a bar that shares its row with other
   * details (a post's date and place) and would otherwise wrap under them.
   * Every button keeps its name for screen readers and as a tooltip.
   */
  compact?: boolean;
  className?: string;
};

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
export function ShareActions({
  title,
  locale,
  url,
  printScope,
  compact = false,
  className,
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () =>
    url
      ? new URL(url, window.location.origin).href
      : window.location.href.split("#")[0];

  const print = () => {
    if (!printScope) {
      window.print();
      return;
    }

    const root = document.documentElement;
    root.dataset.printScope = printScope;
    window.addEventListener("afterprint", () => delete root.dataset.printScope, {
      once: true,
    });
    window.print();
  };
  const labels =
    locale === "en"
      ? {
          share: "Share",
          native: "Share this page",
          copy: "Copy link",
          copied: "Copied",
          print: "Print / PDF",
          facebook: "Share on Facebook",
          whatsapp: "Share on WhatsApp",
          linkedin: "Share on LinkedIn",
        }
      : {
          share: "শেয়ার",
          native: "এই পেজটি শেয়ার করুন",
          copy: "লিঙ্ক কপি",
          copied: "কপি হয়েছে",
          print: "প্রিন্ট / PDF",
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

  const buttonClass = compact
    ? "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-600 transition-ui hover:bg-surface hover:text-brand-800 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
    : "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-sm px-2 text-sm font-semibold text-ink-700 transition-ui hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:px-2.5";
  // Visible text beside the icon, except in the compact bar.
  const textClass = compact ? "sr-only" : "sr-only sm:not-sr-only";

  return (
    <div
      data-print-hide
      className={cn(
        // One row, always. It scrolls sideways on the narrowest phones; it
        // used to wrap on tablets and laptops, leaving "Print" alone below.
        "flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain sm:overflow-visible",
        className,
      )}
      aria-label={labels.share}
    >
      <button
        type="button"
        onClick={() => void nativeShare()}
        className={buttonClass}
        title={compact ? labels.native : undefined}
      >
        <Share2 className="size-4" aria-hidden="true" />
        <span className={textClass}>{labels.share}</span>
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
        <span className={textClass}>
          {copied ? labels.copied : labels.copy}
        </span>
      </button>

      <button
        type="button"
        onClick={print}
        className={buttonClass}
        aria-label={labels.print}
        title={labels.print}
      >
        <Printer className="size-4" aria-hidden="true" />
        <span className={textClass}>{labels.print}</span>
      </button>
    </div>
  );
}
