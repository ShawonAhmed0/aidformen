"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ locale, t }: { locale: Locale; t: Dictionary }) {
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Replaces alert(): the message now sits in the form, is announced
            // to screen readers, and does not block the page.
            setLoading(false);
            setFormError(error.message);
            toast.error(t.auth.loginFailed);
            return;
        }

        const user = data.user;

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        // Redirect target is unchanged.
        if (profile?.role === "admin") {
            router.push("/admin");
        } else {
            router.push(`/${locale}/dashboard`);
        }
    };

    return (
        <main className="bg-surface-sunken">
            <Container className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center py-14">
                <Card
                    padded="lg"
                    elevation="md"
                    className="w-full max-w-md"
                >
                    <div className="flex flex-col items-center text-center">
                        <Image
                            src="/logo (1).png"
                            alt=""
                            width={60}
                            height={60}
                            priority
                            className="size-15 object-contain"
                        />

                        <h1 className="mt-4 text-3xl text-brand-800">{t.auth.loginTitle}</h1>

                        <p className="mt-2 text-sm text-ink-500">
                            {t.auth.loginSubtitle}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} noValidate className="mt-8 space-y-5">
                        {/* Form-level error, announced once rather than per field. */}
                        {formError && (
                            <div
                                role="alert"
                                className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger"
                            >
                                {formError}
                            </div>
                        )}

                        <Field label={t.auth.email} icon={Mail} required>
                            {(props) => (
                                <Input
                                    {...props}
                                    name="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            )}
                        </Field>

                        <Field
                            label={t.auth.password}
                            icon={Lock}
                            required
                            action={
                                <Link
                                    href={`/${locale}/forgot-password`}
                                    className="rounded-sm text-xs font-medium text-brand-700 transition-ui hover:text-brand-800 hover:underline"
                                >
                                    {t.auth.forgot}
                                </Link>
                            }
                        >
                            {(props) => (
                                <div className="relative">
                                    <Input
                                        {...props}
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`${props.className} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-800"
                                        aria-label={
                                            showPassword
                                                ? t.auth.hidePassword
                                                : t.auth.showPassword
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-[18px]" />
                                        ) : (
                                            <Eye className="size-[18px]" />
                                        )}
                                    </button>
                                </div>
                            )}
                        </Field>

                        <label className="flex items-center gap-2.5 text-sm text-ink-600">
                            <input
                                type="checkbox"
                                name="remember"
                                className="size-4 rounded border-ink-300 accent-brand-800"
                            />
                            {t.auth.remember}
                        </label>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" aria-hidden="true" />
                                    {t.auth.loggingIn}
                                </>
                            ) : (
                                <>
                                    {t.auth.loginCta}
                                    <ArrowLeft aria-hidden="true" className="rotate-180" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="my-7 flex items-center gap-3">
                        <span className="h-px flex-1 bg-ink-200" />
                        <span className="text-xs text-ink-500">{t.auth.or}</span>
                        <span className="h-px flex-1 bg-ink-200" />
                    </div>

                    <div className="space-y-3">
                        <Button variant="outline" size="lg" className="w-full">
                            <Image
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt=""
                                width={20}
                                height={20}
                                className="size-5"
                            />
                            {t.auth.googleLogin}
                        </Button>

                        <Button variant="outline" size="lg" className="w-full">
                            <Image
                                src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                                alt=""
                                width={20}
                                height={20}
                                className="size-5"
                            />
                            {t.auth.facebookLogin}
                        </Button>
                    </div>

                    <p className="mt-8 text-center text-sm text-ink-600">
                        {t.auth.noAccount}{" "}
                        <Link
                            href={`/${locale}/register`}
                            className="rounded-sm font-semibold text-brand-700 transition-ui hover:text-brand-800 hover:underline"
                        >
                            {t.auth.registerCta}
                        </Link>
                    </p>
                </Card>
            </Container>
        </main>
    );
}
