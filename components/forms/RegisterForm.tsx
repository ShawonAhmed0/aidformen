"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
    Image as ImageIcon,
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type Errors = Partial<
    Record<"fullName" | "email" | "password" | "confirmPassword" | "avatar" | "terms", string>
>;

export function RegisterForm({ locale, t }: { locale: Locale; t: Dictionary }) {
    const supabase = createClient();
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);

    const validate = () => {
        const next: Errors = {};
        if (!fullName.trim()) next.fullName = t.auth.errName;
        if (!email.trim()) {
            next.email = t.contact.errEmail;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            next.email = t.contact.errEmailFormat;
        }
        if (password.length < 6) {
            next.password = t.auth.errPasswordShort;
        }
        if (confirmPassword !== password) {
            next.confirmPassword = t.auth.errPasswordMatch;
        }
        if (avatar && avatar.size > MAX_AVATAR_BYTES) {
            next.avatar = t.auth.errPhotoSize;
        }
        if (!acceptedTerms) {
            next.terms = t.auth.errTerms;
        }
        return next;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);

        const found = validate();
        setErrors(found);

        if (Object.keys(found).length > 0) {
            document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
            return;
        }

        setLoading(true);

        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setLoading(false);
            setFormError(error.message);
            toast.error(t.auth.registerFailed);
            return;
        }

        const user = data.user;

        if (!user) {
            setLoading(false);
            setFormError(t.auth.registerFailed);
            toast.error(t.auth.registerFailed);
            return;
        }

        // 2. Upload avatar if exists
        let avatarUrl = null;

        if (avatar) {
            const fileName = `${user.id}-${avatar.name}`;

            const { error: uploadError } = await supabase.storage
                .from("avatar")
                .upload(fileName, avatar);

            if (uploadError) {
                console.log(uploadError);
            } else {
                const { data } = supabase.storage
                    .from("avatar")
                    .getPublicUrl(fileName);

                avatarUrl = data.publicUrl;
            }
        }

        // 3. Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            full_name: fullName,
            phone,
            date_of_birth: dateOfBirth,
            avatar_url: avatarUrl,
            role: "member",
        });

        setLoading(false);

        if (profileError) {
            console.log(profileError);
            setFormError(profileError.message);
            toast.error(t.auth.registerFailed);
            return;
        }

        toast.success(t.auth.registerSuccess);
        router.push(`/${locale}/login`);
    };

    return (
        <main className="bg-surface-sunken">
            <Container className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center py-14">
                <Card padded="lg" elevation="md" className="w-full max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <Image
                            src="/logo (1).png"
                            alt=""
                            width={60}
                            height={60}
                            priority
                            className="size-15 object-contain"
                        />

                        <h1 className="mt-4 text-3xl text-brand-800">{t.auth.registerTitle}</h1>

                        <p className="mt-2 text-sm text-ink-500">
                            {t.auth.registerSubtitle}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                        {formError && (
                            <div
                                role="alert"
                                className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger"
                            >
                                {formError}
                            </div>
                        )}

                        <Field label={t.auth.fullName} icon={User} required error={errors.fullName}>
                            {(props) => (
                                <Input
                                    {...props}
                                    name="fullName"
                                    autoComplete="name"
                                    placeholder="আপনার পুরো নাম"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            )}
                        </Field>

                        <Field label={t.auth.email} icon={Mail} required error={errors.email}>
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

                        <Field label={t.auth.phone} icon={Phone}>
                            {(props) => (
                                <Input
                                    {...props}
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="01XXXXXXXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            )}
                        </Field>

                        <Field label={t.auth.dob} icon={Calendar}>
                            {(props) => (
                                <Input
                                    {...props}
                                    name="dateOfBirth"
                                    type="date"
                                    autoComplete="bday"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                />
                            )}
                        </Field>

                        {/* Avatar */}
                        <div className="space-y-2">
                            <span className="flex text-sm font-medium text-ink-700">
                                {t.auth.photo}{" "}
                                <span className="ml-1 font-normal text-ink-500">
                                    ({t.common.optional})
                                </span>
                            </span>

                            <label className="flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-ink-300 p-4 transition-ui hover:border-brand-500 hover:bg-brand-50/50">
                                <span
                                    className={
                                        avatar
                                            ? "flex size-11 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success"
                                            : "flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"
                                    }
                                >
                                    {avatar ? (
                                        <CheckCircle2 className="size-5" aria-hidden="true" />
                                    ) : (
                                        <ImageIcon className="size-5" aria-hidden="true" />
                                    )}
                                </span>

                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-ink-800">
                                        {avatar ? avatar.name : t.auth.choosePhoto}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-ink-500">
                                        {t.auth.photoHint}
                                    </span>
                                </span>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setAvatar(file);
                                        setErrors((prev) => ({ ...prev, avatar: undefined }));
                                    }}
                                />
                            </label>

                            {errors.avatar && (
                                <p role="alert" className="text-xs font-medium text-danger">
                                    {errors.avatar}
                                </p>
                            )}
                        </div>

                        <Field
                            label={t.auth.password}
                            icon={Lock}
                            required
                            error={errors.password}
                            helper={t.auth.passwordHelper}
                        >
                            {(props) => (
                                <div className="relative">
                                    <Input
                                        {...props}
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
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

                        <Field
                            label={t.auth.confirmPassword}
                            icon={Lock}
                            required
                            error={errors.confirmPassword}
                        >
                            {(props) => (
                                <Input
                                    {...props}
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            )}
                        </Field>

                        {/* Terms */}
                        <div className="space-y-2">
                            <label className="flex items-start gap-2.5 text-sm text-ink-600">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    aria-invalid={errors.terms ? true : undefined}
                                    onChange={(e) => {
                                        setAcceptedTerms(e.target.checked);
                                        setErrors((prev) => ({ ...prev, terms: undefined }));
                                    }}
                                    className="mt-1 size-4 shrink-0 rounded border-ink-300 accent-brand-800"
                                />
                                <span>
                                    {t.auth.acceptPre}{" "}
                                    <Link
                                        href={`/${locale}/terms`}
                                        className="rounded-sm font-medium text-brand-700 hover:underline"
                                    >
                                        {t.footer.terms}
                                    </Link>{" "}
                                    {t.auth.acceptMid}{" "}
                                    <Link
                                        href={`/${locale}/privacy`}
                                        className="rounded-sm font-medium text-brand-700 hover:underline"
                                    >
                                        {t.footer.privacy}
                                    </Link>{" "}
                                    {t.auth.acceptPost}
                                </span>
                            </label>

                            {errors.terms && (
                                <p role="alert" className="text-xs font-medium text-danger">
                                    {errors.terms}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" aria-hidden="true" />
                                    {t.auth.registering}
                                </>
                            ) : (
                                <>
                                    নিবন্ধন করুন
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
                            {t.auth.googleRegister}
                        </Button>

                        <Button variant="outline" size="lg" className="w-full">
                            <Image
                                src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                                alt=""
                                width={20}
                                height={20}
                                className="size-5"
                            />
                            {t.auth.facebookRegister}
                        </Button>
                    </div>

                    <p className="mt-8 text-center text-sm text-ink-600">
                        {t.auth.haveAccount}{" "}
                        <Link
                            href={`/${locale}/login`}
                            className="rounded-sm font-semibold text-brand-700 transition-ui hover:text-brand-800 hover:underline"
                        >
                            {t.auth.loginCta}
                        </Link>
                    </p>
                </Card>
            </Container>
        </main>
    );
}
