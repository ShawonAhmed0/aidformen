"use client";

import { ExternalLink, Music2, Pause, Play } from "lucide-react";
import { useId, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n/config";

const waveform = [
    30, 52, 38, 72, 46, 84, 58, 34, 64, 92, 48, 76,
    40, 68, 88, 54, 32, 62, 80, 44, 70, 96, 60, 36,
    56, 82, 42, 74, 50, 90, 66, 38, 78, 58, 86, 46,
    68, 94, 52, 72, 40, 80, 62, 34, 70, 88, 48, 64,
] as const;

const playerCopy = {
    bn: {
        title: "আমাদের গল্প শুনুন",
        description:
            "সংগঠনের পথচলা ও কাজের কথা অডিওতে শুনতে প্লে বাটনে চাপুন।",
        play: "পরিচিতি অডিও চালান",
        pause: "পরিচিতি অডিও বিরতি দিন",
        seek: "অডিওর অবস্থান পরিবর্তন করুন",
        unavailable: "পরিচিতি অডিওটি শিগগিরই এখানে যোগ করা হবে।",
        error: "অডিওটি এই ব্রাউজারে চালানো যায়নি।",
        open: "অডিও ফাইল খুলুন",
    },
    en: {
        title: "Listen to our story",
        description:
            "Press play to hear about the organisation's journey and its work.",
        play: "Play the About audio",
        pause: "Pause the About audio",
        seek: "Seek through the audio",
        unavailable: "The audio introduction will be added here soon.",
        error: "This browser could not play the audio.",
        open: "Open the audio file",
    },
} as const;

function formatClock(value: number, locale: Locale) {
    if (!Number.isFinite(value) || value < 0) return "--:--";

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    const clock = `${minutes}:${String(seconds).padStart(2, "0")}`;

    if (locale === "en") return clock;
    const digits = "০১২৩৪৫৬৭৮৯";
    return clock.replace(/\d/g, (digit) => digits[Number(digit)]);
}

export function HomeAboutAudioPlayer({
    src,
    locale,
}: {
    src: string | null;
    locale: Locale;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const headingId = useId();
    const copy = playerCopy[locale];
    const [duration, setDuration] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const safeElapsed = safeDuration ? Math.min(elapsed, safeDuration) : 0;
    const progress = safeDuration ? safeElapsed / safeDuration : 0;

    if (!src) {
        return (
            <section
                aria-labelledby={headingId}
                className="flex h-full min-h-72 flex-col justify-center rounded-2xl bg-brand-900 p-6 text-brand-50 shadow-lg sm:p-8"
            >
                <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-brand-100">
                    <Music2 className="size-6" aria-hidden="true" />
                </span>
                <h3 id={headingId} className="mt-5 text-xl text-white sm:text-2xl">
                    {copy.title}
                </h3>
                <p className="mt-3 text-sm text-brand-100">{copy.unavailable}</p>
            </section>
        );
    }

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audio.paused) {
            audio.pause();
            return;
        }

        setFailed(false);
        try {
            await audio.play();
        } catch {
            setPlaying(false);
            setFailed(true);
        }
    };

    const seek = (next: number) => {
        const audio = audioRef.current;
        if (!audio || !safeDuration) return;

        const bounded = Math.min(Math.max(next, 0), safeDuration);
        audio.currentTime = bounded;
        setElapsed(bounded);
    };

    return (
        <section
            aria-labelledby={headingId}
            aria-busy={!ready && !failed}
            className="flex h-full min-h-80 flex-col justify-between rounded-2xl bg-brand-900 p-6 text-brand-50 shadow-lg sm:p-8"
        >
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                className="hidden"
                onLoadedMetadata={(event) => {
                    const nextDuration = event.currentTarget.duration;
                    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
                    setReady(true);
                    setFailed(false);
                }}
                onDurationChange={(event) => {
                    const nextDuration = event.currentTarget.duration;
                    if (Number.isFinite(nextDuration)) setDuration(nextDuration);
                }}
                onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setElapsed(0);
                }}
                onEmptied={() => {
                    setPlaying(false);
                    setReady(false);
                    setDuration(0);
                    setElapsed(0);
                }}
                onError={() => {
                    setPlaying(false);
                    setReady(false);
                    setFailed(true);
                }}
            />

            <div>
                <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-brand-100">
                    <Music2 className="size-6" aria-hidden="true" />
                </span>
                <h3 id={headingId} className="mt-5 text-xl text-white sm:text-2xl">
                    {copy.title}
                </h3>
                <p className="mt-3 max-w-md text-sm text-brand-100">
                    {copy.description}
                </p>
            </div>

            <div className="mt-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => void togglePlayback()}
                        aria-label={playing ? copy.pause : copy.play}
                        aria-pressed={playing}
                        className="flex size-13 shrink-0 items-center justify-center rounded-full bg-white text-brand-900 shadow-md transition-ui hover:-translate-y-0.5 hover:bg-brand-50"
                    >
                        {playing ? (
                            <Pause className="size-5" fill="currentColor" aria-hidden="true" />
                        ) : (
                            <Play
                                className="ml-0.5 size-5"
                                fill="currentColor"
                                aria-hidden="true"
                            />
                        )}
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="relative h-16 rounded-xl bg-white/8 px-3 py-2">
                            <div
                                aria-hidden="true"
                                className="flex h-full items-center gap-0.5 overflow-hidden rounded-lg"
                            >
                                {waveform.map((height, index) => (
                                    <span
                                        key={index}
                                        className={
                                            (index + 1) / waveform.length <= progress
                                                ? "min-w-0 flex-1 rounded-full bg-ochre-300"
                                                : "min-w-0 flex-1 rounded-full bg-brand-200/45"
                                        }
                                        style={{ height: `${height}%` }}
                                    />
                                ))}
                            </div>

                            <input
                                type="range"
                                min={0}
                                max={safeDuration}
                                step={0.01}
                                value={safeElapsed}
                                disabled={!ready || !safeDuration}
                                onChange={(event) => seek(event.currentTarget.valueAsNumber)}
                                aria-label={copy.seek}
                                aria-valuetext={`${formatClock(safeElapsed, locale)} / ${formatClock(
                                    safeDuration,
                                    locale
                                )}`}
                                className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent disabled:cursor-wait [&::-moz-range-progress]:bg-transparent [&::-moz-range-thumb]:h-14 [&::-moz-range-thumb]:w-1 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-1 [&::-webkit-slider-thumb]:h-14 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>

                        <div
                            className="mt-2 flex items-center justify-between text-xs text-brand-100"
                            aria-live="off"
                        >
                            <time>{formatClock(safeElapsed, locale)}</time>
                            <time>{formatClock(safeDuration, locale)}</time>
                        </div>
                    </div>
                </div>

                {failed && (
                    <p role="alert" className="mt-4 text-sm text-brand-100">
                        {copy.error}{" "}
                        <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-white underline underline-offset-4"
                        >
                            {copy.open}
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                    </p>
                )}
            </div>
        </section>
    );
}
