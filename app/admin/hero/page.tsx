import { createClient } from "@/lib/supabase/server";
import { HeroEditor } from "@/components/admin/HeroEditor";

export default async function HeroPage() {
    const supabase = await createClient();

    const { data: hero } = await supabase
        .from("hero_content")
        .select("title, description, image_url")
        .limit(1)
        .single();

    const initialData = {
        title: hero?.title || "",
        description: hero?.description || "",
        image_url: hero?.image_url || null,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
                    হিরো সেকশন
                </h1>
                <p className="mt-1 text-[13.5px] text-slate-500">
                    ওয়েবসাইটের মূল হিরো সেকশন এডিট করুন
                </p>
            </div>

            <HeroEditor initialData={initialData} />
        </div>
    );
}