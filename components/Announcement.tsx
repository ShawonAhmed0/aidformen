import { Megaphone } from "lucide-react";

export default function Announcement() {
    return (
        <section className="px-6 md:px-12 -mt-8 relative z-30">
            <div className="max-w-6xl mx-auto">

                <div className="
                    bg-white/60
                    backdrop-blur-xl
                    border border-white/30
                    shadow-xl
                    rounded-xl
                    p-6 md:p-8
                    flex flex-col md:flex-row items-center gap-6
                ">

                    {/* Badge */}
                    <div className="flex items-center gap-2 bg-red-50/70 text-red-600 px-4 py-2 rounded-full font-semibold text-sm shrink-0 backdrop-blur-md border border-red-100/40">
                        <Megaphone size={18} />
                        জরুরি আপডেট
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-[#004d65] mb-1">
                            আন্তর্জাতিক পুরুষ দিবস ২০২৫-এর প্রস্তুতি সভা
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base">
                            আগামী ১৯শে নভেম্বর উপলক্ষে আয়োজিত বিশেষ সেমিনারে অংশগ্রহণের জন্য নিবন্ধন চলছে।
                            দ্রুত আসন নিশ্চিত করুন।
                        </p>
                    </div>

                    {/* Button */}
                    <button className="
                        bg-[#004d65]
                        text-white
                        px-6 py-3
                        rounded-lg
                        font-bold
                        hover:bg-[#003a4d]
                        transition
                        shadow-md
                    ">
                        নিবন্ধন করুন
                    </button>

                </div>

            </div>
        </section>
    );
}