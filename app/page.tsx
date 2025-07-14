import HeroStatic from '@/components/HeroStatic'
import CollectionsSection from '@/components/CollectionsSection'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Static Section */}
      <HeroStatic />
      
      {/* Collections Section */}
      <CollectionsSection />
      
      {/* Custom Project Section */}
      <CustomProjectSection />
      
      {/* About Section */}
      <AboutSection />
    </main>
  )
}