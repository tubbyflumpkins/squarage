import HeroSlideshow from '@/components/HeroSlideshow'
import CollectionsSection from '@/components/CollectionsSection'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Slideshow Section */}
      <HeroSlideshow />
      
      {/* Collections Section */}
      <CollectionsSection />
      
      {/* Custom Project Section */}
      <CustomProjectSection />
      
      {/* About Section */}
      <AboutSection />
    </main>
  )
}