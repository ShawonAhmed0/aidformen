"use client";

import { useState } from "react";
import {
    Download,
    Image as ImageIcon,
    PlayCircle,
    FileText,
} from "lucide-react";

const filters = [
    "সব কার্যক্রম",
    "আইনি সহায়তা",
    "সচেতনতা মূলক সভা",
    "মিডিয়া কভারেজ",
    "প্রকাশনা",
];

const items = [
    {
        title: "২০২৩ সালের বার্ষিক রিপোর্ট প্রকাশ",
        action: "পিডিএফ ডাউনলোড",
        icon: Download,
        image:
            "https://picsum.photos/200/300",
    },
    {
        title: "নারায়ণগঞ্জ জেলা মতবিনিময় সভা",
        action: "গ্যালারি দেখুন",
        icon: ImageIcon,
        image:
            "https://picsum.photos/200/300",
    },
    {
        title: "জাতীয় প্রেস ক্লাবে সংবাদ সম্মেলন",
        action: "ভিডিও দেখুন",
        icon: PlayCircle,
        image:
            "https://picsum.photos/200/300",
    },
    {
        title: "অক্টোবর ২০২৪ মাসিক নিউজলেটার",
        action: "অনলাইনে পড়ুন",
        icon: FileText,
        image:
            "https://picsum.photos/200/300",
    },
];

export default function ArchivePreview() {
    const [active, setActive] = useState("সব কার্যক্রম");

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                        আর্কাইভ প্রিভিউ
                    </h2>
                    <p className="text-gray-600">
                        আমাদের গত কয়েক বছরের কার্যক্রমের একটি সংক্ষিপ্ত চিত্র। আপনি বিভাগ অনুযায়ী ফিল্টার করে দেখতে পারেন।
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {filters.map((item) => (
                        <button
                            key={item}
                            onClick={() => setActive(item)}
                            className={`px-5 py-2 rounded-full font-bold border transition
                ${active === item
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {items.map((item, idx) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition group"
                            >
                                {/* Image */}
                                <div className="h-44 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h4 className="font-bold text-primary mb-3 leading-snug">
                                        {item.title}
                                    </h4>

                                    <button className="text-primary text-lg font-bold flex items-center gap-2 group">
                                        {item.action}
                                        <Icon className="w-4 h-4 group-hover:translate-x-1 transition" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                </div>

            </div>
        </section>
    );
}