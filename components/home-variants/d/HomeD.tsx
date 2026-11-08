import HeroStatic from '@/components/HeroStatic'
import CollectionsSection from '@/components/CollectionsSection'
import AboutSection from '@/components/AboutSection'
import CustomPieceTitle from './CustomPieceTitle'
import DesignerHero from './DesignerHero'
import MoreSpecificSection from './MoreSpecificSection'

/** Version D: today's page, with /custom folded in under "Want a Custom Piece?" */
export default function HomeD() {
  return (
    <>
      <HeroStatic />
      <CollectionsSection />
      <CustomPieceTitle />
      <DesignerHero />
      <MoreSpecificSection />
      <AboutSection />
    </>
  )
}
