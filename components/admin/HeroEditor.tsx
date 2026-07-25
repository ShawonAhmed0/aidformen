"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateHeroContent } from "@/lib/actions/hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Save, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner"; // or your preferred toast

interface HeroEditorProps {
    initialData: {
        title: string;
        description: string;
        image_url: string | null;
    };
}

export function HeroEditor({ initialData }: HeroEditorProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState(initialData.title || "");
    const [description, setDescription] = useState(initialData.description || "");
    const [previewImage, setPreviewImage] = useState<string | null>(
        initialData.image_url
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        if (selectedFile) {
            formData.append("image", selectedFile);
        }

        const result = await updateHeroContent(formData);

        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
            return;
        }

        toast.success("হিরো সেকশন সফলভাবে আপডেট হয়েছে!");
        router.refresh();
    };

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Editor Form */}
            <div className="space-y-6">
                <div className="rounded-xl border border-slate-200/80 bg-white p-6">
                    <h2 className="text-[16px] font-semibold text-slate-900 mb-6">
                        হিরো সেকশন এডিট করুন
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label className="text-[13.5px]">হিরো ইমেজ</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-teal-400 hover:bg-teal-50/30"
                            >
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Hero preview"
                                        className="h-full w-full rounded-xl object-cover"
                                    />
                                ) : (
                                    <>
                                        <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                                        <p className="text-[13px] text-slate-500">
                                            নতুন ছবি আপলোড করতে ক্লিক করুন
                                        </p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-[13.5px]">
                                শিরোনাম
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="হিরো সেকশনের শিরোনাম লিখুন"
                                className="h-11 rounded-lg"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[13.5px]">
                                বিবরণ
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="হিরো সেকশনের বিবরণ লিখুন"
                                className="min-h-[120px] rounded-lg resize-none"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    সংরক্ষণ করা হচ্ছে...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    পরিবর্তন সংরক্ষণ করুন
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-4">
                <h2 className="text-[16px] font-semibold text-slate-900">
                    লাইভ প্রিভিউ
                </h2>

                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                    {/* Preview Image */}
                    <div className="relative h-56 w-full bg-slate-100">
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-400">
                                <ImageIcon className="h-12 w-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h3 className="text-xl font-bold leading-snug line-clamp-2">
                                {title || "শিরোনাম এখানে দেখাবে"}
                            </h3>
                            <p className="mt-2 text-[14px] text-white/85 line-clamp-2">
                                {description || "বিবরণ এখানে দেখাবে"}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-[12.5px] text-slate-500">
                    এই প্রিভিউটি আপনার ওয়েবসাইটের হিরো সেকশনের মতো দেখাবে।
                </p>
            </div>
        </div>
    );
}