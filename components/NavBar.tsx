"use client";

import Link from "next/link";
import { Menu, Phone, LogIn } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: "হোম", href: "/" },
        { name: "সম্পর্কে", href: "/about" },
        { name: "আর্কাইভ", href: "/archive" },
        { name: "যোগাযোগ", href: "/contact" },
        { name: "ফোরাম", href: "/forum" },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-3 text-2xl font-bold text-sky-800 [font-family:var(--font-bengali-serif)]"
                >
                    <Image
                        src="/logo (1).png"
                        alt="এইড ফর মেন Logo"
                        width={40}
                        height={40}
                        priority
                    />
                    <span>এইড ফর মেন</span>
                </Link>

                {/* Desktop Menu */}
                <nav className="hidden items-center gap-8 md:flex">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`border-b-2 pb-1 text-lg font-medium transition-colors ${isActive
                                        ? "border-sky-800 text-sky-800"
                                        : "border-transparent text-gray-600 hover:border-sky-800 hover:text-sky-700"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side */}
                <div className="hidden items-center gap-4 md:flex">
                    <button className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium">
                        EN/বাংলা
                    </button>

                    <Link
                        href="/login"
                        className="flex items-center gap-2 rounded-lg border border-sky-700 px-5 py-2 font-semibold text-sky-700 transition hover:bg-sky-700 hover:text-white"
                    >
                        <LogIn size={18} />
                        লগইন
                    </Link>

                    <a
                        href="tel:01404555999"
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700"
                    >
                        <Phone size={18} />
                        জরুরি যোগাযোগ
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden"
                    aria-label="Toggle Menu"
                >
                    <Menu size={28} />
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="border-t bg-white md:hidden">
                    <nav className="flex flex-col p-4">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`rounded-lg px-3 py-3 text-lg transition ${isActive
                                            ? "bg-sky-100 font-semibold text-sky-800"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}

                        <div className="mt-4 flex flex-col gap-3">
                            <button className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium">
                                EN/বাংলা
                            </button>

                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 rounded-lg border border-sky-700 px-5 py-3 font-semibold text-sky-700 transition hover:bg-sky-700 hover:text-white"
                            >
                                <LogIn size={18} />
                                লগইন
                            </Link>

                            <a
                                href="tel:01404555999"
                                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
                            >
                                <Phone size={18} />
                                জরুরি যোগাযোগ
                            </a>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}