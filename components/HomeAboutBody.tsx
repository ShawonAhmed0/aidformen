"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The homepage "About" copy, clamped to a few lines until the reader asks for
 * the rest. The full text is always in the DOM — clamping is visual only, so
 * screen readers and crawlers get every word either way.
 */
export function HomeAboutBody({
  intro,
  journeyTitle,
  journey,
  moreLabel,
  lessLabel,
  storyHref,
  storyLabel,
}: {
  intro: string;
  journeyTitle: string;
  journey: string;
  moreLabel: string;
  lessLabel: string;
  storyHref: string;
  storyLabel: string;
}) {
  const regionId = useId();
  const introRef = useRef<HTMLParagraphElement>(null);
  const journeyRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Assume the copy overflows so the toggle is in the server HTML; the
  // observer hides it only if a wide viewport fits everything unclamped.
  const [overflows, setOverflows] = useState(true);

  useEffect(() => {
    if (expanded) return;

    const blocks = [introRef.current, journeyRef.current].filter(
      (block): block is HTMLParagraphElement => block !== null,
    );
    // ResizeObserver reports once on observe(), so this also runs the
    // initial measurement without a synchronous setState in the effect.
    const observer = new ResizeObserver(() => {
      setOverflows(blocks.some((block) => block.scrollHeight > block.clientHeight + 1));
    });
    blocks.forEach((block) => observer.observe(block));

    return () => observer.disconnect();
  }, [expanded]);

  return (
    <>
      <div id={regionId} className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <p
          ref={introRef}
          className={cn("text-base leading-8 text-ink-700", !expanded && "line-clamp-4")}
        >
          {intro}
        </p>

        <div className="border-s-2 border-ochre-400 ps-5">
          <h3 className="text-lg text-brand-900">{journeyTitle}</h3>
          <p
            ref={journeyRef}
            className={cn("mt-1.5 text-sm leading-7 text-ink-600", !expanded && "line-clamp-3")}
          >
            {journey}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {overflows || expanded ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={regionId}
            className="-ms-3 inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-brand-700 transition-ui hover:bg-brand-50 hover:text-brand-800"
          >
            {expanded ? lessLabel : moreLabel}
            <ChevronDown
              className={cn("size-4 transition-ui", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span />
        )}

        <Link
          href={storyHref}
          className={buttonVariants({ variant: "outline", size: "md", className: "gap-2" })}
        >
          {storyLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
