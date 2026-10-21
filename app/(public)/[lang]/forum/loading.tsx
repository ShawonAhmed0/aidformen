import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function ForumLoading() {
    return (
        <main aria-busy="true" aria-labelledby="forum-loading-status">
            <div className="border-b border-brand-800 bg-brand-950">
                <Container>
                    <div className="py-14 sm:py-18">
                        <div className="motion-safe:animate-pulse">
                            <div className="h-3 w-24 rounded-full bg-brand-700" />
                            <div className="mt-5 h-10 max-w-lg rounded-xl bg-brand-800 sm:h-12" />
                            <div className="mt-4 h-4 max-w-xl rounded-full bg-brand-800/80" />
                        </div>
                    </div>
                </Container>
            </div>

            <Section space="sm" containerWidth="prose">
                <p id="forum-loading-status" className="sr-only" role="status">
                    Loading the community forum… কমিউনিটি ফোরাম লোড হচ্ছে…
                </p>

                <div className="space-y-4 motion-safe:animate-pulse" aria-hidden="true">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="rounded-2xl border border-ink-200 p-5 sm:p-6">
                            <div className="h-4 w-32 rounded-full bg-ink-100" />
                            <div className="mt-5 h-6 w-4/5 rounded-lg bg-ink-100" />
                            <div className="mt-4 h-4 rounded-full bg-ink-100" />
                            <div className="mt-2 h-4 w-2/3 rounded-full bg-ink-100" />
                        </div>
                    ))}
                </div>
            </Section>
        </main>
    );
}
