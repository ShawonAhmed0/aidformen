import { Globe, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#0b1f2a] text-white">
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">

                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold">এইড ফর মেন</h3>

                        <p className="text-white/70 text-lg leading-relaxed">
                            পুরুষ অধিকার ও বৈষম্যহীন সমাজ গঠনে একটি অরাজনৈতিক ও অলাভজনক প্রতিষ্ঠান।
                        </p>

                        <div className="flex gap-4 mt-2">

                            <Globe className="w-5 h-5 text-white/60 hover:text-white transition" />
                            <Mail className="w-5 h-5 text-white/60 hover:text-white transition" />
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4">দ্রুত লিঙ্ক</h4>
                        <div className="flex flex-col gap-2 text-white/70 text-lg">
                            <a className="hover:text-white transition">আমাদের সম্পর্কে</a>
                            <a className="hover:text-white transition">আইনি সহায়তা</a>
                            <a className="hover:text-white transition">সাম্প্রতিক কার্যক্রম</a>
                            <a className="hover:text-white transition">গ্যালারি</a>
                        </div>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">আইনি ও শর্তাবলী</h4>
                        <div className="flex flex-col gap-2 text-white/70 text-lg">
                            <a className="hover:text-white transition">গোপনীয়তা নীতি</a>
                            <a className="hover:text-white transition">শর্তাবলী</a>
                            <a className="hover:text-white transition">সচরাচর জিজ্ঞাস্য</a>
                            <a className="hover:text-white transition">নিবন্ধন তথ্য</a>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4">যোগাযোগ</h4>

                        <div className="flex flex-col gap-3 text-white/70 text-lg">

                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-1" />
                                <span>১৯৩, মতিঝিল, ঢাকা-১০০০</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>+৮৮ ০১৪০৪৫৫৫৯৯৯</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>info@aidformen.com</span>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Bottom */}
                <div className="border-t border-white/10 mt-12 pt-6 text-center text-white/50 text-lg">
                    © ২০২৪ এইড ফর মেন ফাউন্ডেশন। সর্বস্বত্ব সংরক্ষিত।
                </div>

            </div>
        </footer>
    );
}