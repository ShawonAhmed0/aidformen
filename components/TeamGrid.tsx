"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Quote, X, ArrowLeft, User } from "lucide-react";

import { Card } from "./ui/card";
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
              {/* Top half of the card, full bleed. basis-1/2 resolves against
                  the card's height, which the grid row makes definite, so every
                  card splits at the same line however long its quote runs.
                  object-top keeps faces in frame when a portrait is cropped. */}
              <span className="relative flex min-h-56 shrink-0 basis-1/2 items-center justify-center overflow-hidden bg-brand-50">
                {member.photo_url ? (
                  <Image
                    src={member.photo_url}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top"
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
                    <blockquote className="mt-3 flex-1 text-base text-ink-600">
                      “{member.quote}”
                    </blockquote>
                  </>
                )}

                {(member.statement || member.bio) && (
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
            className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-surface p-7 shadow-xl sm:p-9"
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
              <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                {selected.photo_url ? (
                  <Image
                    src={selected.photo_url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <User className="size-9 text-brand-600" aria-hidden="true" />
                )}
              </span>

              <h2 id="team-member-name" className="mt-4 text-2xl text-ink-900">
                {selected.name}
              </h2>

              <p className="mt-1.5 text-sm font-semibold text-brand-700">
                {selected.role}
              </p>
            </div>

            {selected.statement && (
              <blockquote className="mt-7 rounded-xl border-l-4 border-ochre-600 bg-ochre-50 p-5 text-base text-ink-700">
                “{selected.statement}”
              </blockquote>
            )}

            {selected.bio && (
              <div className="mt-6">
                <h3 className="text-base text-ink-900">{t.team.profile}</h3>
                <p className="mt-2 text-base text-ink-600">{selected.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
