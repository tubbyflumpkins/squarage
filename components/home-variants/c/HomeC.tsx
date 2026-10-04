import HeroStatic from '@/components/HeroStatic'
import CollectionsSection from '@/components/CollectionsSection'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'

export default function HomeC() {
  return (
    <>
      <HeroStatic />
      <CollectionsSection />
      <CustomProjectSection />
      <AboutSection />
    </>
  )
}
