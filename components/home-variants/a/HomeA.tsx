import HeroStatic from '@/components/HeroStatic'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'
import CollectionsSectionA from './CollectionsSectionA'

/** Version A, "Swap": today's page with the shelf designer in the Warped row's photo half. */
export default function HomeA() {
  return (
    <>
      <HeroStatic />
      <CollectionsSectionA />
      <CustomProjectSection />
      <AboutSection />
    </>
  )
}
