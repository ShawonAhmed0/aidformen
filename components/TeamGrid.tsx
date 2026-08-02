"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Quote, X, ArrowLeft, Download, User } from "lucide-react";

import { Card } from "./ui/card";
import { buttonVariants } from "./ui/button";
import { focalPosition } from "@/lib/types/content";
import type { Dictionary } from "@/lib/i18n/dictionary";

/** Locale already resolved by the page — these are plain display strings. */
export type TeamCard = {
  id: string;
  name: string;
  role: string;
  quote: string;
  statement: string;
  bio: string;
  photo_url: string | null;
  signature_url: string | null;
  profile_pdf_url: string | null;
  focal_x: number;
  focal_y: number;
};


export function TeamGrid({ members, t }: { members: TeamCard[]; t: Dictionary }) {
  const [selected, setSelected] = useState<TeamCard | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Remembers which card opened the dialog so focus can return there on close.
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setSelected(null);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!selected) return;

    const node = dialogRef.current;
    const focusables = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }

      // Keep Tab inside the dialog while it is open.
      if (event.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected, close]);

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <li key={member.id}>
            <Card
              padded="none"
              interactive
              className="flex h-full flex-col overflow-hidden text-center"
            >
              {/* Full-bleed photo across the top, sized by its own aspect ratio
                  rather than a share of the card. basis-1/2 looks equivalent but
                  is circular: the grid derives the row height from the content,
                  then half of that leaves the text less room than it needs, and
                  min-height:auto makes it overflow instead of shrink — which
                  clipped the "read more" button. Which part of the portrait
                  survives the crop is set per member in the admin. */}
              <span className="relative flex aspect-4/3 w-full shrink-0 items-center justify-center overflow-hidden bg-brand-50">
                {member.photo_url ? (
                  <Image
                    src={member.photo_url}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    style={{
                      objectPosition: focalPosition(member.focal_x, member.focal_y),
                    }}
                  />
                ) : (
                  <User className="size-12 text-brand-600" aria-hidden="true" />
                )}
              </span>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h2 className="text-xl text-ink-900">{member.name}</h2>

                <p className="mt-1.5 text-sm font-semibold text-brand-700">
                  {member.role}
                </p>

                {member.quote && (
                  <>
                    <hr className="my-5 border-ink-200" />
                    <Quote
                      className="mx-auto size-5 text-ochre-600"
                      aria-hidden="true"
                    />
                    {/* No `whitespace-pre-line` here on purpose: the card quote
                        is one short line, and honouring stray breaks would make
                        the cards in a row different heights. */}
                    <blockquote className="mt-3 flex-1 text-base text-ink-600">
                      “{member.quote}”
                    </blockquote>
                  </>
                )}

                {(member.statement ||
                  member.bio ||
                  member.profile_pdf_url ||
                  member.signature_url) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setSelected(member);
                    }}
                    className="group mx-auto mt-6 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                  >
                    {t.home.readMore}
                    <span className="sr-only">— {member.name}</span>
                    <ArrowLeft
                      aria-hidden="true"
                      className="size-4 rotate-180 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-member-name"
            className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-7 shadow-xl sm:p-9"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
              aria-label={t.team.close}
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* A portrait rather than an avatar: this dialog is the only place
                  the member is seen at any size, and the card above already
                  gives the small version. Same focal point as the card so the
                  face stays framed. */}
              <span className="relative flex aspect-4/5 w-44 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 sm:w-52">
                {selected.photo_url ? (
                  <Image
                    src={selected.photo_url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 208px, 176px"
                    className="object-cover"
                    style={{
                      objectPosition: focalPosition(selected.focal_x, selected.focal_y),
                    }}
                  />
                ) : (
                  <User className="size-16 text-brand-600" aria-hidden="true" />
                )}
              </span>

              <h2 id="team-member-name" className="mt-5 text-2xl text-ink-900">
                {selected.name}
              </h2>

              <p className="mt-1.5 text-sm font-semibold text-brand-700">
                {selected.role}
              </p>
            </div>

            {/* `whitespace-pre-line` keeps the paragraph breaks the editor typed
                in the admin textarea. HTML collapses them by default, which ran
                a multi-paragraph statement together as one wall of text. */}
            {selected.statement && (
              <blockquote className="mt-7 whitespace-pre-line rounded-xl border-l-4 border-ochre-600 bg-ochre-50 p-5 text-base text-ink-700">
                “{selected.statement}”
              </blockquote>
            )}

            {selected.bio && (
              <div className="mt-6">
                <h3 className="text-base text-ink-900">{t.team.profile}</h3>
                <p className="mt-2 whitespace-pre-line text-base text-ink-600">
                  {selected.bio}
                </p>
              </div>
            )}

            {(selected.profile_pdf_url || selected.signature_url) && (
              <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-ink-200 pt-6">
                {/* Routed through our own origin: the browser ignores `download`
                    on a cross-origin link and silently does nothing. */}
                {selected.profile_pdf_url && (
                  <a
                    href={`/api/team/${selected.id}/pdf`}
                    download
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <Download aria-hidden="true" />
                    {t.team.downloadPdf}
                  </a>
                )}

                {selected.signature_url && (
                  <figure className="ml-auto text-right">
                    <Image
                      src={selected.signature_url}
                      alt={`${selected.name} — ${t.team.signature}`}
                      width={320}
                      height={120}
                      sizes="200px"
                      className="ml-auto h-14 w-auto object-contain object-right sm:h-16"
                    />
                    <figcaption className="mt-1 border-t border-ink-300 pt-1.5 text-xs text-ink-500">
                      {selected.name}
                    </figcaption>
                  </figure>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
