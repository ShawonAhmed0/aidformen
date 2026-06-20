import { Shield } from "lucide-react";
export default function NewsletterCTA() {
    return (
        <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">

                {/* Card */}
                <div className="relative bg-primary text-white rounded-3xl overflow-hidden">

                    {/* 🔥 Decorative Logo Layer */}
                    <div className="absolute top-1/2 right-1/12 -translate-y-1/2 opacity-10 pointer-events-none">
                        <Shield className="w-[220px] h-[220px]" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-10 md:p-20 max-w-2xl">

                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            আমাদের কার্যক্রমে যুক্ত হতে চান?
                        </h2>

                        <p className="text-white/80 mb-8 leading-relaxed">
                            পুরুষ অধিকার রক্ষা ও সচেতনতা বৃদ্ধিতে আমরা নিয়মিত ইমেইল নিউজলেটার পাঠাই।
                        </p>

                        <form className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="আপনার ইমেইল ঠিকানা"
                                className="w-full sm:flex-1 px-6 py-4 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-white/30"
                            />

                            <button className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition">
                                সাবস্ক্রাইব
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </section>
    );
}