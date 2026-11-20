"use client";

import {
    ExternalLink,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    Volume2,
    VolumeX,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useId, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Decorative only — a fixed silhouette, not the file's real peaks. Decoding
// the audio to draw a true waveform would download the whole file up front.
const waveform = [
    30, 52, 38, 72, 46, 84, 58, 34, 64, 92, 48, 76,
    40, 68, 88, 54, 32, 62, 80, 44, 70, 96, 60, 36,
    56, 82, 42, 74, 50, 90, 66, 38, 78, 58, 86, 46,
    68, 94, 52, 72, 40, 80, 62, 34, 70, 88, 48, 64,
] as const;

const rates = [1, 1.25, 1.5, 2] as const;
const SKIP_SECONDS = 10;

const playerCopy = {
    bn: {
        title: "আমাদের গল্প শুনুন",
        subtitle: "সংগঠনের পরিচিতি, অডিওতে",
        label: "অডিও গল্প",
        nowPlaying: "এখন চলছে",
        soon: "শিগগিরই আসছে",
        play: "পরিচিতি অডিও চালান",
        pause: "পরিচিতি অডিও বিরতি দিন",
        seek: "অডিওর অবস্থান পরিবর্তন করুন",
        back: "১০ সেকেন্ড পিছনে যান",
        forward: "১০ সেকেন্ড সামনে যান",
        speed: "প্লেব্যাক গতি",
        mute: "শব্দ বন্ধ করুন",
        unmute: "শব্দ চালু করুন",
        error: "অডিওটি এই ব্রাউজারে চালানো যায়নি।",
        open: "অডিও ফাইল খুলুন",
    },
    en: {
        title: "Listen to our story",
        subtitle: "The foundation's story, in audio",
        label: "Audio story",
        nowPlaying: "Now playing",
        soon: "Coming soon",
        play: "Play the About audio",
        pause: "Pause the About audio",
        seek: "Seek through the audio",
        back: "Back 10 seconds",
        forward: "Forward 10 seconds",
        speed: "Playback speed",
        mute: "Mute",
        unmute: "Unmute",
        error: "This browser could not play the audio.",
        open: "Open the audio file",
    },
} as const;

function localizeDigits(value: string, locale: Locale) {
    if (locale === "en") return value;
    const digits = "০১২৩৪৫৬৭৮৯";
    return value.replace(/\d/g, (digit) => digits[Number(digit)]);
}

function formatClock(value: number, locale: Locale) {
    if (!Number.isFinite(value) || value < 0) return "--:--";

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return localizeDigits(`${minutes}:${String(seconds).padStart(2, "0")}`, locale);
}

/** Three bars that dance while audio plays and rest otherwise. */
function Equalizer({ active }: { active: boolean }) {
    const reduceMotion = useReducedMotion();
    const animate = active && !reduceMotion;

    return (
        <span aria-hidden="true" className="flex h-3 items-end gap-0.5">
            {[0.55, 1, 0.75].map((rest, index) => (
                <motion.span
                    key={index}
                    className="h-full w-0.75 origin-bottom rounded-full bg-ochre-300"
                    initial={false}
                    animate={animate ? { scaleY: [rest, 0.3, 1, rest] } : { scaleY: rest }}
                    transition={
                        animate
                            ? { duration: 0.9 + index * 0.15, repeat: Infinity, ease: "easeInOut" }
                            : { duration: 0.2 }
                    }
                />
            ))}
        </span>
    );
}

function SkipIcon({ direction, locale }: { direction: "back" | "forward"; locale: Locale }) {
    const Icon = direction === "back" ? RotateCcw : RotateCw;

    return (
        <span aria-hidden="true" className="relative flex">
            <Icon className="size-6" strokeWidth={1.75} />
            <span className="absolute inset-0 flex items-center justify-center pt-px text-[0.5625rem] font-bold">
                {localizeDigits(String(SKIP_SECONDS), locale)}
            </span>
        </span>
    );
}

const iconButton =
    "flex size-11 items-center justify-center rounded-full text-brand-100 transition-ui hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40";

export function HomeAboutAudioPlayer({
    src,
    locale,
    title,
    subtitle,
    label,
}: {
    src: string | null;
    locale: Locale;
    /** Overrides for when the player isn't the foundation's own story — a post's recording. */
    title?: string;
    subtitle?: string;
    label?: string;
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const headingId = useId();
    const copy = {
        ...playerCopy[locale],
        ...(title ? { title } : {}),
        ...(subtitle ? { subtitle } : {}),
        ...(label ? { label } : {}),
    };
    const [duration, setDuration] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const [rate, setRate] = useState<(typeof rates)[number]>(1);
    const [muted, setMuted] = useState(false);

    // The <audio> is in the server HTML, so preload="metadata" can finish (or
    // fail) before hydration attaches onLoadedMetadata/onError — the clock
    // then sat at --:-- for good. Catch up from the element when React
    // attaches it.
    const attachAudio = useCallback((audio: HTMLAudioElement | null) => {
        audioRef.current = audio;
        if (!audio) return;

        if (audio.error) {
            setFailed(true);
        } else if (
            audio.readyState >= HTMLMediaElement.HAVE_METADATA &&
            Number.isFinite(audio.duration)
        ) {
            setDuration(audio.duration);
            setReady(true);
        }
    }, []);

    const available = Boolean(src);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const safeElapsed = safeDuration ? Math.min(elapsed, safeDuration) : 0;
    const progress = safeDuration ? safeElapsed / safeDuration : 0;

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

    const cycleRate = () => {
        const next = rates[(rates.indexOf(rate) + 1) % rates.length];
        setRate(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (audio) audio.muted = !audio.muted;
    };

    const status = !available ? copy.soon : playing ? copy.nowPlaying : copy.label;

    return (
        <section
            aria-labelledby={headingId}
            aria-busy={available && !ready && !failed}
            className="relative overflow-hidden rounded-2xl bg-brand-950 px-4 py-2 text-white shadow-lg ring-1 ring-white/5 sm:px-5"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 -left-20 size-72 rounded-full bg-brand-600/25 blur-3xl"
            />

            {src && (
                <audio
                    ref={attachAudio}
                    src={src}
                    preload="metadata"
                    className="hidden"
                    onLoadedMetadata={(event) => {
                        const nextDuration = event.currentTarget.duration;
                        setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
                        // A fresh source resets the element's rate; keep the chosen one.
                        event.currentTarget.playbackRate = rate;
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
                    onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
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
            )}

            <div className="relative flex flex-col gap-1.5 sm:gap-2 lg:flex-row lg:items-center lg:gap-6">
                <div className="flex min-w-0 items-center gap-4 lg:w-68 lg:shrink-0">
                    <button
                        type="button"
                        onClick={() => void togglePlayback()}
                        disabled={!available}
                        aria-label={playing ? copy.pause : copy.play}
                        className={cn(
                            "relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-950 shadow-lg transition-ui",
                            available ? "hover:scale-105 hover:bg-brand-50" : "cursor-not-allowed opacity-40",
                            playing && "ring-4 ring-white/15",
                        )}
                    >
                        {playing ? (
                            <Pause className="size-5" fill="currentColor" aria-hidden="true" />
                        ) : (
                            <Play className="ml-0.5 size-5" fill="currentColor" aria-hidden="true" />
                        )}
                    </button>

                    <div className="min-w-0">
                        <p className="flex items-center gap-2 text-2xs leading-4 font-semibold uppercase tracking-[0.12em] text-ochre-300">
                            <Equalizer active={playing} />
                            {status}
                        </p>
                        <h3 id={headingId} className="truncate text-lg leading-snug text-white">
                            {copy.title}
                        </h3>
                        <p className="truncate text-xs leading-4 text-brand-100">{copy.subtitle}</p>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-brand-100">
                            {available ? formatClock(safeElapsed, locale) : "--:--"}
                        </span>

                        <div className={cn("group relative h-8 min-w-0 flex-1", !available && "opacity-50")}>
                            <div aria-hidden="true" className="flex h-full items-center gap-0.75">
                                {waveform.map((height, index) => (
                                    <span
                                        key={index}
                                        className={cn(
                                            "min-w-0 flex-1 rounded-full transition-colors duration-150",
                                            (index + 0.5) / waveform.length <= progress
                                                ? "bg-ochre-300"
                                                : "bg-white/20 group-hover:bg-white/30",
                                        )}
                                        style={{ height: `${height}%` }}
                                    />
                                ))}
                            </div>

                            {available && (
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
                                        locale,
                                    )}`}
                                    className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent disabled:cursor-wait [&::-moz-range-progress]:bg-transparent [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-0.75 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-0.75 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                />
                            )}
                        </div>

                        <span className="w-9 shrink-0 text-xs tabular-nums text-brand-100">
                            {ready ? formatClock(safeDuration, locale) : "--:--"}
                        </span>
                    </div>

                    {/* Negative block margin: the buttons keep their 44px touch
                        target while the player takes 36px of height for them. */}
                    {available && (
                        <div className="-my-1 grid grid-cols-4 place-items-center sm:flex sm:shrink-0 sm:gap-1">
                            <button
                                type="button"
                                onClick={() => seek(safeElapsed - SKIP_SECONDS)}
                                disabled={!ready}
                                aria-label={copy.back}
                                className={iconButton}
                            >
                                <SkipIcon direction="back" locale={locale} />
                            </button>

                            <button
                                type="button"
                                onClick={() => seek(safeElapsed + SKIP_SECONDS)}
                                disabled={!ready}
                                aria-label={copy.forward}
                                className={iconButton}
                            >
                                <SkipIcon direction="forward" locale={locale} />
                            </button>

                            <button
                                type="button"
                                onClick={cycleRate}
                                aria-label={`${copy.speed}: ${localizeDigits(String(rate), locale)}×`}
                                className="flex h-11 min-w-14 items-center justify-center rounded-full px-3 text-xs font-semibold tabular-nums text-brand-50 ring-1 ring-white/15 transition-ui ring-inset hover:bg-white/10 hover:text-white"
                            >
                                {localizeDigits(String(rate), locale)}×
                            </button>

                            <button
                                type="button"
                                onClick={toggleMute}
                                aria-label={muted ? copy.unmute : copy.mute}
                                className={iconButton}
                            >
                                {muted ? (
                                    <VolumeX className="size-5" aria-hidden="true" />
                                ) : (
                                    <Volume2 className="size-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {failed && src && (
                <p role="alert" className="relative mt-4 text-sm text-brand-100">
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
        </section>
    );
}
