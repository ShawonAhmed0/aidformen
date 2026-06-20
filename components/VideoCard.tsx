// components/VideoCard.tsx
import { Play } from "lucide-react";

export default function VideoCard({
    image,
    title,
    duration,
    year,
}: {
    image: string;
    title: string;
    duration: string;
    year: string;
}) {
    return (
        <div className="flex flex-col">
            <div className="relative group aspect-video rounded-xl overflow-hidden mb-4">
                <img src={image} className="w-full h-full object-cover" />

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="text-primary w-7 h-7" />
                    </div>
                </div>
            </div>

            <h4 className="text-xl font-bold text-primary mb-1">{title}</h4>
            <p className="text-sm text-gray-500">
                সময়কাল: {duration} • {year}
            </p>
        </div>
    );
}