import { getCarouselImages } from "@/lib/carousel";

export default async function TestPage() {
    const images = await getCarouselImages();

    return (
        <main className="p-8">
            <h1>Carousel Test</h1>

            <pre>{JSON.stringify(images, null, 2)}</pre>

            {images.length === 0 && <p>No images found.</p>}
        </main>
    );
}