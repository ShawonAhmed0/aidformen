"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { ContentsNav } from "@/components/ContentsNav";
import { ShareActions } from "@/components/ShareActions";
import { buttonVariants } from "@/components/ui/button";
import type { AboutDocBlock, HomeAboutDoc } from "@/lib/content/home-about";
import { cn } from "@/lib/utils";

function DocBlock({ block }: { block: AboutDocBlock }) {
  if (block.type === "subheading") {
    return <h4 className="mt-8 text-lg leading-snug text-brand-900">{block.text}</h4>;
  }

  if (block.type === "list") {
    return (
      <ul className="mt-4 space-y-3">
        {block.items.map((item) => (
          <li key={item.label} className="relative ps-5 text-base leading-8 text-ink-700">
            <span
              aria-hidden="true"
              className="absolute start-0 top-[13px] size-1.5 rounded-full bg-ochre-400"
            />
            <strong className="font-semibold text-ink-900">{item.label}:</strong> {item.text}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-4 text-base leading-8 text-ink-700">
      {block.label && <strong className="font-semibold text-ink-900">{block.label}: </strong>}
      {block.text}
    </p>
  );
}

/**
 * The homepage "About" essay. Collapsed, it previews the opening paragraph
 * beside the foundation's own story; expanded, it becomes the full essay with
 * a contents list that stays in view on laptops while the reader scrolls.
 *
 * A shared link (`?about=full#about`) renders it already expanded, so the
 * reader lands on the essay, not on a preview they then have to open.
 */
export function HomeAboutBody({
  doc,
  journeyTitle,
  moreLabel,
  lessLabel,
  contentsLabel,
  defaultExpanded = false,
  locale,
  share,
}: {
  doc: HomeAboutDoc;
  journeyTitle: string;
  moreLabel: string;
  lessLabel: string;
  contentsLabel: string;
  defaultExpanded?: boolean;
  locale: "bn" | "en";
  share: { title: string; url: string; printScope: string };
}) {
  const regionId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // A printout of a three-line preview is useless, so whatever prints the
  // page — the Print button or Ctrl+P — gets the full essay, and the reader
  // gets their own view back afterwards. flushSync because the browser takes
  // its snapshot as soon as the beforeprint handlers return.
  // Arriving from a shared link: land on the section at once. The browser's
  // own #fragment jump fights the page still streaming in and, with smooth
  // scrolling on, only arrived seconds later — after the reader had started
  // scrolling the hero themselves.
  useEffect(() => {
    if (!defaultExpanded) return;
    const hash = new URL(share.url, window.location.origin).hash;
    if (!hash || window.location.hash !== hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [defaultExpanded, share.url]);

  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    let restoreTo: boolean | null = null;

    const beforePrint = () => {
      restoreTo = expandedRef.current;
      flushSync(() => setExpanded(true));
    };
    const afterPrint = () => {
      if (restoreTo !== null) setExpanded(restoreTo);
      restoreTo = null;
    };

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const [opening] = doc.sections;
  const intro = opening.blocks.find((block) => block.type === "p")?.text ?? "";
  const sectionId = (index: number) => `${regionId}-section-${index}`;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);

    // Collapsing a long essay would otherwise leave the reader far below
    // the card, staring at whatever section comes next.
    if (!next) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        toggleRef.current?.scrollIntoView({
          block: "center",
          behavior: reduce ? "auto" : "smooth",
        }),
      );
    }
  };

  return (
    <>
      {expanded ? (
        <div
          id={regionId}
          className="mt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12"
        >
          <div className="hidden lg:block" data-print-hide>
            <ContentsNav
              label={contentsLabel}
              items={doc.sections.map((section, index) => ({
                id: sectionId(index),
                title: section.heading,
              }))}
              className="sticky top-24"
            />
          </div>

          <div className="max-w-3xl">
            {doc.sections.map((section, index) => (
              <div
                key={section.heading}
                className={cn(index > 0 && "mt-10 border-t border-ink-200 pt-8")}
              >
                <h3
                  id={sectionId(index)}
                  className="scroll-mt-24 text-xl leading-snug text-brand-900 sm:text-2xl"
                >
                  {section.heading}
                </h3>
                {section.blocks.map((block, blockIndex) => (
                  <DocBlock key={blockIndex} block={block} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div id={regionId} className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <h3 className="text-lg leading-snug text-brand-900">{opening.heading}</h3>
            <p className="mt-2 line-clamp-4 text-base leading-8 text-ink-700">{intro}</p>
          </div>

          <div className="border-s-2 border-ochre-400 ps-5">
            <h3 className="text-lg leading-snug text-brand-900">{journeyTitle}</h3>
            <p className="mt-2 line-clamp-4 text-sm leading-7 text-ink-600">{doc.journey}</p>
          </div>
        </div>
      )}

      {/* Sharing on the left, the one control that opens the essay on the
          right. The shared link always points at the expanded essay, whatever
          state this reader happens to be in. */}
      <div
        className="mt-6 flex flex-wrap items-center justify-between gap-3"
        data-print-hide
      >
        <ShareActions
          title={share.title}
          locale={locale}
          url={share.url}
          printScope={share.printScope}
          className="-ms-2"
        />

        <button
          ref={toggleRef}
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={regionId}
          className={buttonVariants({
            variant: "outline",
            size: "md",
            // Wraps under the share icons on phones; full width keeps it the
            // obvious next step rather than a stray button at the left edge.
            className: "gap-2 max-sm:w-full sm:ms-auto",
          })}
        >
          {expanded ? lessLabel : moreLabel}
          <ChevronDown
            className={cn("size-4 transition-ui", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>
    </>
  );
}
