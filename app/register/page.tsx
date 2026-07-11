"use client";

import Link from "next/link";
import Image from "next/image";
import {
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
    Image as ImageIcon,
    ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
                    {/* Logo */}
                    <div className="mb-8 flex flex-col items-center">
                        <Image
                            src="/logo (1).png"
                            alt="এইড ফর মেন"
                            width={70}
                            height={70}
                        />

                        <h1 className="mt-4 text-3xl font-bold text-sky-800 [font-family:var(--font-bengali-serif)]">
                            নিবন্ধন করুন
                        </h1>

                        <p className="mt-2 text-center text-gray-500">
                            আমাদের কমিউনিটির একজন সদস্য হয়ে উঠুন
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                পুরো নাম
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-700">
                                <User className="text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="আপনার পুরো নাম"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                ইমেইল
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-700">
                                <Mail className="text-gray-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                ফোন নম্বর
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-700">
                                <Phone className="text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    placeholder="01XXXXXXXXX"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                জন্ম তারিখ
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-700">
                                <Calendar className="text-gray-400" size={18} />
                                <input
                                    type="date"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        {/* Profile Photo */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                প্রোফাইল ছবি (ঐচ্ছিক)
                            </label>

                            <label className="flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 p-4 transition hover:border-sky-700 hover:bg-sky-50">
                                <ImageIcon className="text-sky-700" size={28} />

                                <div>
                                    <p className="font-medium text-gray-700">
                                        ছবি নির্বাচন করুন
                                    </p>

                                    <p className="text-lg text-gray-500">
                                        JPG, PNG, WEBP (Max 5MB)
                                    </p>
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                পাসওয়ার্ড
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-700">
                                <Lock className="text-gray-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-2 block text-lg font-medium text-gray-700">
                                পাসওয়ার্ড নিশ্চিত করুন
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-700">
                                <Lock className="text-gray-400" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-2 text-lg text-gray-600">
                            <input type="checkbox" className="mt-1" />

                            <span>
                                আমি{" "}
                                <Link
                                    href="/terms"
                                    className="font-medium text-sky-700 hover:underline"
                                >
                                    শর্তাবলী
                                </Link>{" "}
                                এবং{" "}
                                <Link
                                    href="/privacy"
                                    className="font-medium text-sky-700 hover:underline"
                                >
                                    গোপনীয়তা নীতি
                                </Link>{" "}
                                মেনে নিচ্ছি।
                            </span>
                        </label>

                        {/* Register Button */}
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 py-3 font-semibold text-white transition hover:bg-sky-800"
                        >
                            নিবন্ধন করুন
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span className="mx-3 text-lg text-gray-500">
                            অথবা
                        </span>
                        <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    {/* Google */}
                    <button className="mb-3 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-medium transition hover:bg-gray-50">
                        <Image
                            src="/google.svg"
                            alt="Google"
                            width={22}
                            height={22}
                        />
                        Google দিয়ে নিবন্ধন করুন
                    </button>

                    {/* Facebook */}
                    <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-medium transition hover:bg-gray-50">
                        <Image
                            src="/facebook.svg"
                            alt="Facebook"
                            width={22}
                            height={22}
                        />
                        Facebook দিয়ে নিবন্ধন করুন
                    </button>

                    {/* Login Link */}
                    <p className="mt-8 text-center text-lg text-gray-600">
                        ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-sky-700 hover:underline"
                        >
                            লগইন করুন
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}