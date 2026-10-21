import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function NewsLoading() {
    return (
        <main aria-busy="true" aria-labelledby="news-loading-status">
            <div className="border-b border-brand-800 bg-brand-950">
                <Container>
                    <div className="py-14 sm:py-18">
                        <div className="motion-safe:animate-pulse">
                            <div className="h-3 w-28 rounded-full bg-brand-700" />
                            <div className="mt-5 h-10 max-w-xl rounded-xl bg-brand-800 sm:h-12" />
                            <div className="mt-4 h-4 max-w-2xl rounded-full bg-brand-800/80" />
                        </div>
                    </div>
                </Container>
            </div>

            <Section space="sm" containerWidth="prose">
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
