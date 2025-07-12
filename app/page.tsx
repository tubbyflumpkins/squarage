import HeroSlideshow from '@/components/HeroSlideshow'
import Navigation from '@/components/Navigation'
import CollectionsSection from '@/components/CollectionsSection'
import AboutSection from '@/components/AboutSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Slideshow Section */}
      <HeroSlideshow />
      
      {/* Collections Section */}
      <CollectionsSection />
      
      {/* About Section */}
      <AboutSection />
    </main>
  )
}