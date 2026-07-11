"use client";

import Image from "next/image";
import Link from "next/link";
import { HeartHandshake, Users, BookOpen, ArrowRight } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="bg-gray-50">
            {/* Hero */}
            <section className="bg-gradient-to-b from-sky-50 to-white">
                <div className="mx-auto max-w-7xl px-6 py-20 text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
                        <Image
                            src="/logo (1).png"
                            alt="এইড ফর মেন"
                            width={70}
                            height={70}
                        />
                    </div>

                    <h1 className="text-5xl font-bold text-sky-800 [font-family:var(--font-bengali-serif)]">
                        আমাদের সম্পর্কে
                    </h1>

                    <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
                        <strong>এইড ফর মেন</strong> একটি সচেতনতামূলক ও সহায়তামূলক
                        প্ল্যাটফর্ম যেখানে পুরুষদের মানসিক স্বাস্থ্য, সম্পর্ক, পারিবারিক
                        সমস্যা, আইনি সহায়তা এবং সামাজিক বিষয় নিয়ে তথ্য, আলোচনা ও সহায়তা
                        প্রদান করা হয়।
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="grid gap-10 md:grid-cols-2">
                    <div>
                        <h2 className="mb-6 text-3xl font-bold text-sky-800">
                            আমাদের লক্ষ্য
                        </h2>

                        <p className="mb-5 text-gray-600 leading-8">
                            আমরা বিশ্বাস করি যে প্রত্যেক মানুষের মতো পুরুষদেরও মানসিক,
                            সামাজিক ও আইনি সহায়তার প্রয়োজন রয়েছে। অনেক সময় তারা তাদের
                            সমস্যাগুলো প্রকাশ করতে সংকোচ বোধ করেন।
                        </p>

                        <p className="text-gray-600 leading-8">
                            আমাদের উদ্দেশ্য একটি নিরাপদ, তথ্যভিত্তিক এবং সহযোগিতামূলক
                            কমিউনিটি গড়ে তোলা যেখানে সবাই সম্মানের সাথে নিজেদের মতামত প্রকাশ
                            করতে পারবেন।
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl shadow-lg">
                        <Image
                            src="/about.jpg"
                            alt="About"
                            width={700}
                            height={500}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-bold text-sky-800">
                            আমরা কী করি
                        </h2>

                        <p className="mt-3 text-gray-600">
                            আমাদের প্ল্যাটফর্মের প্রধান কার্যক্রম
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg">
                            <HeartHandshake
                                className="mb-5 text-sky-700"
                                size={42}
                            />

                            <h3 className="mb-3 text-xl font-semibold">
                                সহায়তা
                            </h3>

                            <p className="leading-7 text-gray-600">
                                মানসিক স্বাস্থ্য, সম্পর্ক ও পারিবারিক সমস্যায় তথ্য ও
                                সচেতনতা প্রদান।
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg">
                            <Users className="mb-5 text-sky-700" size={42} />

                            <h3 className="mb-3 text-xl font-semibold">
                                কমিউনিটি
                            </h3>

                            <p className="leading-7 text-gray-600">
                                সদস্যরা নিরাপদভাবে পোস্ট করতে, মতামত দিতে এবং একে অপরকে
                                সহায়তা করতে পারবেন।
                            </p>
                        </div>

                        <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg">
                            <BookOpen className="mb-5 text-sky-700" size={42} />

                            <h3 className="mb-3 text-xl font-semibold">
                                তথ্যভান্ডার
                            </h3>

                            <p className="leading-7 text-gray-600">
                                গবেষণা, নিবন্ধ, আইনি তথ্য এবং বিভিন্ন রিসোর্স এক জায়গায়
                                পাওয়া যাবে।
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision */}
            <section className="mx-auto max-w-5xl px-6 py-20 text-center">
                <h2 className="text-3xl font-bold text-sky-800">
                    আমাদের ভিশন
                </h2>

                <p className="mt-6 text-lg leading-8 text-gray-600">
                    এমন একটি বাংলাদেশ গড়ে তোলা যেখানে পুরুষদের মানসিক স্বাস্থ্য,
                    পারিবারিক অধিকার এবং সামাজিক কল্যাণ নিয়ে খোলামেলা আলোচনা হবে এবং
                    প্রয়োজনে তারা সহজেই সহায়তা পাবেন।
                </p>
            </section>

            {/* CTA */}
            <section className="bg-sky-800 py-20">
                <div className="mx-auto max-w-4xl px-6 text-center text-white">
                    <h2 className="text-4xl font-bold">
                        আমাদের কমিউনিটিতে যোগ দিন
                    </h2>

                    <p className="mt-4 text-lg text-sky-100">
                        নিবন্ধন করুন, আলোচনা করুন এবং অন্যদের সহায়তা করুন।
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            href="/register"
                            className="rounded-lg bg-white px-6 py-3 font-semibold text-sky-800 transition hover:bg-gray-100"
                        >
                            নিবন্ধন করুন
                        </Link>

                        <Link
                            href="/forum"
                            className="flex items-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold transition hover:bg-white hover:text-sky-800"
                        >
                            ফোরামে যান
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}