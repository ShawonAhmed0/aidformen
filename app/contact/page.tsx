"use client";

import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";

export default function ContactPage() {
    return (
        <main className="bg-gray-50">
            {/* Hero */}
            <section className="bg-gradient-to-b from-sky-50 to-white py-20">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <h1 className="text-5xl font-bold text-sky-800 [font-family:var(--font-bengali-serif)]">
                        যোগাযোগ
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
                        আপনার প্রশ্ন, মতামত বা সহায়তার প্রয়োজন হলে আমাদের সাথে যোগাযোগ
                        করুন।
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Left */}
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow">
                            <div className="flex items-center gap-4">
                                <Phone className="text-red-600" size={30} />

                                <div>
                                    <h3 className="text-xl font-semibold">
                                        জরুরি যোগাযোগ
                                    </h3>

                                    <p className="mt-1 text-lg text-gray-600">
                                        01404-555999
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow">
                            <div className="flex items-center gap-4">
                                <Mail className="text-sky-700" size={30} />

                                <div>
                                    <h3 className="text-xl font-semibold">
                                        ইমেইল
                                    </h3>

                                    <p className="mt-1 text-lg text-gray-600">
                                        info@aidformen.org
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow">
                            <div className="flex items-center gap-4">
                                <MapPin className="text-sky-700" size={30} />

                                <div>
                                    <h3 className="text-xl font-semibold">
                                        ঠিকানা
                                    </h3>

                                    <p className="mt-1 text-lg text-gray-600">
                                        ঢাকা, বাংলাদেশ
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow">
                            <div className="flex items-center gap-4">
                                <Clock className="text-sky-700" size={30} />

                                <div>
                                    <h3 className="text-xl font-semibold">
                                        অফিস সময়
                                    </h3>

                                    <p className="mt-1 text-lg text-gray-600">
                                        শনিবার - বৃহস্পতিবার
                                    </p>

                                    <p className="text-lg text-gray-600">
                                        সকাল ৯:০০ - সন্ধ্যা ৬:০০
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="rounded-2xl bg-white p-8 shadow">
                        <h2 className="mb-8 text-3xl font-bold text-sky-800">
                            আমাদের লিখুন
                        </h2>

                        <form className="space-y-5">
                            <div>
                                <label className="mb-2 block text-lg font-medium">
                                    আপনার নাম
                                </label>

                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 p-4 text-lg outline-none focus:border-sky-700"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-lg font-medium">
                                    ইমেইল
                                </label>

                                <input
                                    type="email"
                                    className="w-full rounded-lg border border-gray-300 p-4 text-lg outline-none focus:border-sky-700"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-lg font-medium">
                                    বিষয়
                                </label>

                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 p-4 text-lg outline-none focus:border-sky-700"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-lg font-medium">
                                    আপনার বার্তা
                                </label>

                                <textarea
                                    rows={6}
                                    className="w-full rounded-lg border border-gray-300 p-4 text-lg outline-none focus:border-sky-700"
                                />
                            </div>

                            <button
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 py-4 text-lg font-semibold text-white transition hover:bg-sky-800"
                                type="submit"
                            >
                                <Send size={20} />
                                বার্তা পাঠান
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Map */}
            <section className="pb-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="overflow-hidden rounded-2xl shadow">
                        <iframe
                            title="Google Map"
                            src="https://www.google.com/maps/embed?pb="
                            className="h-[450px] w-full"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}