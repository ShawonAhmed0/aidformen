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
            "https://lh3.googleusercontent.com/aida/AP1WRLv6H9bVv-ZILdsPAoBTfff7BrxC2eMsvVMCCcNBZbsxAwTVTw5_vNIMtYq4kht_6YyLiDph8UILH_LaMvEXTI15ohx98jQ6n-DqdUSAzSWdW7quDgz-gQlrDhdaydVQLpVJPY1jZZBs8WXohhOACYXrX4GQ09A7WuzLbQeNrUE4XJ8tLR89d5tpOmIFs3cY4IUH_DaGSWMKQlplw4duyLvXt1ZNtXK_4MoRsY6YqL8V87U6OYIdcaD2rONz",
    },
    {
        title: "নারায়ণগঞ্জ জেলা মতবিনিময় সভা",
        action: "গ্যালারি দেখুন",
        icon: ImageIcon,
        image:
            "https://lh3.googleusercontent.com/aida/AP1WRLv8Ajf0tFBDtC6oWsOkgBBrvVBocMh6E95InoVkdLZahuiZGRtNSJFgOKECV_gHDn8MzlUL5MotsKB2qRqPZy5faUBHAjJwccDyDjwmp2tWP1oDpb7zdqp61wAdHCuOsElei2mrJTC2jdobYSaR9bOCt6WIYYWzyRvTiqkBDYMHiO7cHCngFgPj6-uBvhX1CYcr-IeDpJkbd_mI0w5Yyh9hh_QqCUxLIYiuJUEv_X24G5qb5LQK8x8UV8fL",
    },
    {
        title: "জাতীয় প্রেস ক্লাবে সংবাদ সম্মেলন",
        action: "ভিডিও দেখুন",
        icon: PlayCircle,
        image:
            "https://lh3.googleusercontent.com/aida/AP1WRLtbqLGOw2Po6YuETTHWvaSHVJv5tS-GN7yOil1jorPbyzBvGFW-mRpM_AYZ1HDgNzeZJDXr6LJaDEexyaLepz3zyIjJ17QK7jtGUwTvANB9rDjw762Oi0C6PvuHJWBWhn8B--6LMm-pZ1fyUsa1lp0UbqySkLt4KwJrNyz-Xoc8oPbn3rosxMsxIwctU4s05w7jSf6foNZgvgDufcp_C5JMfK71yYW9mFp8sMGtmKXWQnStf4cB0OYiH0Bh",
    },
    {
        title: "অক্টোবর ২০২৪ মাসিক নিউজলেটার",
        action: "অনলাইনে পড়ুন",
        icon: FileText,
        image:
            "https://lh3.googleusercontent.com/aida/AP1WRLux649PvMlTunIgae5eJ-UlBIbpATBlDDun4XHWwJYqanynmAeD0ZluestqTlKct33a6OIVy9e4LcXs99OPjcJDAeaa1Q78ZtKT4FkpDEC83Qvj-f9ZiY26AJjWbR4i1wuds0yIQdQyt6OnOq_ClPi5_gZhWHBxBPamuqzM6ZZPZtt0oIKybE327JTsbFyrfd_gLzL-bF80JFX3op_l4iVnWhXqB756wY-vGyvrPh2O4PszWkvazCLZ7OtK",
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

                                    <button className="text-primary text-sm font-bold flex items-center gap-2 group">
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