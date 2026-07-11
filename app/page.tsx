import Announcement from "@/components/Announcement";
import ArchivePreview from "@/components/ArchivePreview";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import LatestActivities from "@/components/LatestActivities";
import MediaSection from "@/components/MediaSection";
import Navbar from "@/components/NavBar"
import NewsletterCTA from "@/components/Newsletter";
export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Announcement />
        <LatestActivities />
        <ArchivePreview />
        <MediaSection />
        <NewsletterCTA />

        {/* Your content */}
      </main>
    </>
  );
}