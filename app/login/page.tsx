"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
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
                            এইড ফর মেন
                        </h1>

                        <p className="mt-2 text-center text-gray-500">
                            আপনার অ্যাকাউন্টে লগইন করুন
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                ইমেইল
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-600">
                                <Mail className="text-gray-400" size={18} />

                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                পাসওয়ার্ড
                            </label>

                            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-sky-600">
                                <Lock className="text-gray-400" size={18} />

                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" />
                                মনে রাখুন
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-sky-700 hover:underline"
                            >
                                পাসওয়ার্ড ভুলে গেছেন?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 py-3 font-semibold text-white transition hover:bg-sky-800"
                        >
                            লগইন করুন
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span className="mx-3 text-sm text-gray-500">অথবা</span>
                        <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    {/* Google */}
                    <button className="mb-3 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-medium transition hover:bg-gray-50">
                        <Image
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            width={22}
                            height={22}
                        />
                        Google দিয়ে চালিয়ে যান
                    </button>

                    {/* Facebook */}
                    <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-medium transition hover:bg-gray-50">
                        <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                            alt="Facebook"
                            width={22}
                            height={22}
                        />
                        Facebook দিয়ে চালিয়ে যান
                    </button>

                    {/* Register */}
                    <p className="mt-8 text-center text-sm text-gray-600">
                        এখনও অ্যাকাউন্ট নেই?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-sky-700 hover:underline"
                        >
                            নিবন্ধন করুন
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}