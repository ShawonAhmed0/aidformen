import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeartHandshake, Users, BookOpen, ArrowLeft } from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "আমাদের সম্পর্কে",
    description:
        "এইড ফর মেন একটি সচেতনতামূলক ও সহায়তামূলক প্ল্যাটফর্ম — পুরুষদের মানসিক স্বাস্থ্য, পারিবারিক ও আইনি বিষয়ে তথ্য ও সহায়তা।",
};

const pillars = [
    {
        icon: HeartHandshake,
        title: "সহায়তা",
        body: "মানসিক স্বাস্থ্য, সম্পর্ক ও পারিবারিক সমস্যায় তথ্য ও সচেতনতা প্রদান।",
    },
    {
        icon: Users,
        title: "কমিউনিটি",
        body: "সদস্যরা নিরাপদভাবে পোস্ট করতে, মতামত দিতে এবং একে অপরকে সহায়তা করতে পারবেন।",
    },
    {
        icon: BookOpen,
        title: "তথ্যভান্ডার",
        body: "গবেষণা, নিবন্ধ, আইনি তথ্য এবং বিভিন্ন রিসোর্স এক জায়গায় পাওয়া যাবে।",
    },
];

export default async function AboutPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    // Copy stays Bengali for now; only the links need the locale prefix.
    const { lang } = await params;

    return (
        <main>
            <PageHero
                eyebrow="আমাদের পরিচয়"
                title="আমাদের সম্পর্কে"
                media={
                    <span className="flex size-20 items-center justify-center rounded-2xl bg-surface shadow-md">
                        <Image
                            src="/logo (1).png"
                            alt=""
                            width={56}
                            height={56}
                            className="size-14 object-contain"
                        />
                    </span>
                }
                description={
                    <p>
                        <strong className="font-semibold text-ink-800">
                            এইড ফর মেন
                        </strong>{" "}
                        একটি সচেতনতামূলক ও সহায়তামূলক প্ল্যাটফর্ম যেখানে পুরুষদের মানসিক
                        স্বাস্থ্য, সম্পর্ক, পারিবারিক সমস্যা, আইনি সহায়তা এবং সামাজিক
                        বিষয় নিয়ে তথ্য, আলোচনা ও সহায়তা প্রদান করা হয়।
                    </p>
                }
            />

            {/* Mission */}
            <Section space="lg">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <SectionHeading
                            eyebrow="লক্ষ্য"
                            title="আমাদের লক্ষ্য"
                            className="mb-7"
                        />

                        <div className="space-y-5 text-base text-ink-600">
                            <p>
                                আমরা বিশ্বাস করি যে প্রত্যেক মানুষের মতো পুরুষদেরও মানসিক,
                                সামাজিক ও আইনি সহায়তার প্রয়োজন রয়েছে। অনেক সময় তারা তাদের
                                সমস্যাগুলো প্রকাশ করতে সংকোচ বোধ করেন।
                            </p>
                            <p>
                                আমাদের উদ্দেশ্য একটি নিরাপদ, তথ্যভিত্তিক এবং সহযোগিতামূলক
                                কমিউনিটি গড়ে তোলা যেখানে সবাই সম্মানের সাথে নিজেদের মতামত
                                প্রকাশ করতে পারবেন।
                            </p>
                        </div>
                    </div>

                    <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-md">
                        <Image
                            src="/about.jpg"
                            alt="এইড ফর মেন ফাউন্ডেশনের কার্যক্রম"
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                        />
                    </div>
                </div>
            </Section>

            {/* Pillars */}
            <Section tone="sunken" space="lg">
                <SectionHeading
                    align="center"
                    eyebrow="কার্যক্রম"
                    title="আমরা কী করি"
                    description="আমাদের প্ল্যাটফর্মের প্রধান কার্যক্রম"
                />

                <ul className="grid gap-5 md:grid-cols-3">
                    {pillars.map(({ icon: Icon, title, body }) => (
                        <li key={title}>
                            <Card padded="lg" className="h-full">
                                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                    <Icon className="size-6" aria-hidden="true" />
                                </span>

                                <h3 className="mt-5 text-xl text-brand-800">{title}</h3>

                                <p className="mt-2.5 text-base text-ink-600">{body}</p>
                            </Card>
                        </li>
                    ))}
                </ul>
            </Section>

            {/* Vision */}
            <Section space="lg" containerWidth="prose">
                <div className="text-center">
                    <SectionHeading
                        align="center"
                        eyebrow="ভিশন"
                        title="আমাদের ভিশন"
                        className="mb-7"
                    />

                    <p className="text-lg text-ink-600">
                        এমন একটি বাংলাদেশ গড়ে তোলা যেখানে পুরুষদের মানসিক স্বাস্থ্য,
                        পারিবারিক অধিকার এবং সামাজিক কল্যাণ নিয়ে খোলামেলা আলোচনা হবে এবং
                        প্রয়োজনে তারা সহজেই সহায়তা পাবেন।
                    </p>
                </div>
            </Section>

            {/* CTA */}
            <section className="bg-brand-800 py-16 text-white sm:py-20">
                <Container width="prose" className="text-center">
                    <h2 className="text-3xl text-white sm:text-4xl">
                        আমাদের কমিউনিটিতে যোগ দিন
                    </h2>

                    <p className="mx-auto mt-4 max-w-lg text-lg text-brand-100">
                        নিবন্ধন করুন, আলোচনা করুন এবং অন্যদের সহায়তা করুন।
                    </p>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={`/${lang}/register`}
                            className={buttonVariants({ variant: "onDark", size: "lg" })}
                        >
                            নিবন্ধন করুন
                        </Link>

                        <Link
                            href={`/${lang}/forum`}
                            className={buttonVariants({
                                variant: "outlineOnDark",
                                size: "lg",
                            })}
                        >
                            ফোরামে যান
                            <ArrowLeft aria-hidden="true" className="rotate-180" />
                        </Link>
                    </div>
                </Container>
            </section>
        </main>
    );
}
