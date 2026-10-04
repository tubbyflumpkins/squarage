import HeroStatic from '@/components/HeroStatic'
import AboutSection from '@/components/AboutSection'
import CollectionsSectionB from './CollectionsSectionB'
import GetInTouchSection from './GetInTouchSection'

export default function HomeB() {
  return (
    <>
      <HeroStatic />
      {/* Marquee, Posé, the shelf designer band, Warped, Tiled */}
      <CollectionsSectionB />
      <GetInTouchSection />
      <AboutSection />
    </>
  )
}
