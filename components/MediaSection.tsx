// components/MediaSection.tsx
import VideoCard from "./VideoCard";

export default function MediaSection() {
    return (
        <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-primary">
                            মিডিয়া ও ডকুমেন্টারি
                        </h2>
                        <p className="text-gray-600 mt-2 text-lg">
                            আমাদের বিভিন্ন কার্যক্রমের ভিডিও চিত্র ও সংবাদ প্রতিবেদন।
                        </p>
                    </div>

                    <button className="bg-gray-100 border px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                        সব ভিডিও
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <VideoCard
                        image="https://lh3.googleusercontent.com/aida-public/AB6AXuD8-iKXpngASDCe-15Hc5LW5B7sseQW6v7FJF9VtkIoXyBHPkY_7uFkVZ_z3QEs7utUL9siBzh0-r1ZnpQxU0RYXBgXqCCdopzM4LOao49uRyCrVnaK-u48GXR-_GC-5mM7R1rjSC_p6RmIaPRQwsehAkEqN5MoIHRA2Dm7huPlIQ3nFmCuLBPuxNq8g0F286VNSB8SYFBPyNbgnr_YErZbPru3JNNEw6m3iLNVX37-yjbWTBiEieqfl9MXMcHmhIREOURhs2i8j9IO"
                        title="পুরুষ অধিকার: একটি বাস্তবধর্মী পর্যালোচনা"
                        duration="১২:৪৫"
                        year="২০২৩"
                    />

                    <VideoCard
                        image="https://lh3.googleusercontent.com/aida-public/AB6AXuB8IU0N9o5NiiQUSBiB3ceWZVCMZNahiXpMJY4a6dt_Xe3Tnh1-BlX6pvdtK7g2H5Qj1-6HOF706L4nTfCgrbn_1jshHHE1x7L1GS70dwD2w36iqSuFSt0TvQW-mKuHdujx7k3fOlp0DTFZWnTIG5KObsz4TkR92SaAZ4JPOyhsfPl4rHbBQKXtjmn-NedD4k2PCopWGopkY7UdKDGg0Q561YjsN3h1vlV9ti7IoCb2k4l45cHMymqoqt74Q1wtKLSRLgID37S6quyC"
                        title="যৌতুকের মিথ্যা মামলা ও পারিবারিক সংকট"
                        duration="০৮:২০"
                        year="২০২৪"
                    />

                    <VideoCard
                        image="https://lh3.googleusercontent.com/aida-public/AB6AXuAGC6PbHPr24rjslio7YS1Hd4IwYE2hXugucZ1T2QYNJWyogmymgDssK2S9ViI4Ok90XgZDGE9suxTwbiMqgVMeTzbmIWQLA6DC2SexNWagKBJyNNWFQBr17OOc8nRvBHHI96B9i05yMsHMa1Tr0tTXXF-K6xJz-_3_h4syOnoPqIfXst0D2HDNs7_EXBKRMXfR2nSuC1bDJ8lT76eV0k1FXgossYL7gFzqSguYMlbCI_b3LswDajWukZs94St9R6GUkQPhDwCTv48Z"
                        title="আন্তর্জাতিক পুরুষ দিবস ২০২২ - বিশেষ প্রতিবেদন"
                        duration="২০:১৫"
                        year="২০২২"
                    />
                </div>
            </div>
        </section>
    );
}