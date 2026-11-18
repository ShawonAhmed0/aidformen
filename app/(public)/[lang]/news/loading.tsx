import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function NewsLoading() {
    return (
        <main aria-busy="true" aria-labelledby="news-loading-status">
            {/* Mirrors PageHero's band and padding, so the real header replaces
                it in place instead of flashing from dark to light. */}
            <div className="border-b border-ink-200 bg-brand-50/60">
                <Container>
                    <div className="pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-14">
                        <div className="flex flex-col items-center motion-safe:animate-pulse">
                            <div className="h-3 w-28 rounded-full bg-brand-100" />
                            <div className="mt-4 h-10 w-full max-w-xl rounded-xl bg-brand-100 sm:h-12" />
                            <div className="mt-6 h-4 w-full max-w-md rounded-full bg-brand-100/80" />
                        </div>
                    </div>
                </Container>
            </div>

            <Section space="md" followsHero>
                <p id="news-loading-status" className="sr-only" role="status">
                    Loading news and media… সংবাদ ও মিডিয়া লোড হচ্ছে…
                </p>

                <div className="space-y-6 motion-safe:animate-pulse" aria-hidden="true">
                    <div className="h-52 rounded-2xl bg-ink-100 sm:h-72" />
                    <div className="h-7 w-4/5 rounded-lg bg-ink-100" />
                    <div className="space-y-3">
                        <div className="h-4 rounded-full bg-ink-100" />
                        <div className="h-4 rounded-full bg-ink-100" />
                        <div className="h-4 w-3/4 rounded-full bg-ink-100" />
                    </div>
                </div>
            </Section>
        </main>
    );
}
