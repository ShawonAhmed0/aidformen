"use client";

import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";

import { ContentsNav } from "@/components/ContentsNav";
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
 */
export function HomeAboutBody({
  doc,
  journeyTitle,
  moreLabel,
  lessLabel,
  contentsLabel,
}: {
  doc: HomeAboutDoc;
  journeyTitle: string;
  moreLabel: string;
  lessLabel: string;
  contentsLabel: string;
}) {
  const regionId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);

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
          <div className="hidden lg:block">
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

      {/* One control, on the right: the outline button is what reads as
          "open the essay". A small text toggle on the left beside it looked
          like a second, lesser action for the same thing. */}
      <div className="mt-6 flex justify-end">
        <button
          ref={toggleRef}
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={regionId}
          className={buttonVariants({ variant: "outline", size: "md", className: "gap-2" })}
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
