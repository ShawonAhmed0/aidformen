import {
    ArrowRight,
    Calendar,
    MapPin,
    ChevronRight,
    HeartHandshake,
    AlertTriangle,
} from "lucide-react";

export default function LatestActivities() {
    return (
        <section className="py-20">
            {/* Container */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex justify-between items-end mb-12 flex-wrap gap-4">

                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                            আমাদের সাম্প্রতিক কার্যক্রম
                        </h2>
                        <div className="h-1.5 w-24 bg-secondary" />
                    </div>

                    <button className="text-primary flex items-center gap-2 font-bold group">
                        সব কার্যক্রম দেখুন
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Big Card */}
                    <div className="md:col-span-2 group relative overflow-hidden rounded-xl aspect-[16/9]">
                        <img
                            src="/Rakib_Tamima_AFM.jpg"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">

                            <div className="bg-secondary text-white px-3 py-1 rounded text-lg font-bold w-fit mb-4">
                                আইনি সহায়তা
                            </div>

                            <h3 className="text-white text-xl md:text-2xl font-bold mb-2">
                                মিথ্যা মামলা প্রতিরোধ ও পুরুষ অধিকার রক্ষায় মানববন্ধন
                            </h3>

                            <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    ০৮ জুন, ২০২৬
                                </span>

                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    প্রেস ক্লাব, ঢাকা
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* Small Card */}
                    <div className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col justify-between hover:shadow-md transition">

                        <div>
                            <div className="text-red-500 font-bold text-sm mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                বিশেষ সচেতনতা
                            </div>

                            <h3 className="text-lg font-bold text-primary mb-4 leading-snug">
                                যৌতুক ও নারী নির্যাতন মামলার অপব্যবহার প্রতিরোধে নতুন নির্দেশিকা
                            </h3>

                            <p className="text-gray-600 text-sm">
                                সম্প্রতি সুপ্রিম কোর্টের নতুন নির্দেশনার আলোকে আমাদের আইনি প্যানেল একটি বিস্তারিত রিপোর্ট তৈরি করেছে...
                            </p>
                        </div>

                        <button className="mt-6 text-primary flex items-center gap-2 font-bold group">
                            বিস্তারিত পড়ুন
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                    </div>

                    {/* CTA Card */}
                    <div className="bg-primary text-white p-6 rounded-xl flex flex-col justify-center items-center text-center">

                        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-6">
                            <HeartHandshake className="w-7 h-7" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            আপনি কি আইনি সাহায্য চান?
                        </h3>

                        <p className="text-white/80 mb-6 text-sm">
                            আমাদের বিশেষজ্ঞ আইনজীবী দল আপনাকে সঠিক দিকনির্দেশনা প্রদান করবে।
                        </p>

                        <button className="bg-white text-primary px-6 py-2 rounded font-bold hover:bg-gray-100 cursor-pointer transition">
                            আবেদন করুন
                        </button>

                    </div>
                </div>

                {/* SECOND ROW (FIXED SEPARATE GRID) */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Item 1 */}
                    <div className="flex gap-4 p-4 hover:bg-gray-50 transition rounded-lg group">

                        <div className="w-24 h-24 shrink-0 rounded overflow-hidden">
                            <img
                                src="/women-commission-cance.webp"
                                className="w-full h-full object-cover group-hover:scale-110 transition"
                            />
                        </div>

                        <div>
                            <span className="text-xs font-bold text-secondary uppercase">
                                সচেতনতা
                            </span>
                            <h4 className="font-bold text-primary mt-1 mb-2 leading-snug">
                                নারী সংস্কার কমিশন বাতিলের দাবি এইড ফর মেন ফাউন্ডেশনের
                            </h4>
                            <span className="text-xs text-gray-500">
                                ০২ মে, ২০২৫
                            </span>
                        </div>

                    </div>

                    {/* Item 2 */}
                    <div className="flex gap-4 p-4 hover:bg-gray-50 transition rounded-lg group">

                        <div className="w-24 h-24 shrink-0 rounded overflow-hidden">
                            <img
                                src="/nasir-tamima-2.jpg"
                                className="w-full h-full object-cover group-hover:scale-110 transition"
                            />
                        </div>

                        <div>
                            <span className="text-xs font-bold text-secondary uppercase">
                                মানববন্ধন
                            </span>
                            <h4 className="font-bold text-primary mt-1 mb-2 leading-snug">
                                ডিভোর্স জালিয়াতি বন্ধে এইড ফর মেন ফাউন্ডেশনের মানববন্ধন

                            </h4>
                            <span className="text-xs text-gray-500">
                                ০৮ জুন, ২০২৬
                            </span>
                        </div>

                    </div>

                </div>

            </div>
        </section>
    );
}