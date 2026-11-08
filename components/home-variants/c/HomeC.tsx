import HeroStatic from '@/components/HeroStatic'
import CustomProjectSection from '@/components/CustomProjectSection'
import AboutSection from '@/components/AboutSection'
import CollectionRows from './CollectionRows'

/**
 * Homepage version C, "Split row": today's page, with the Warped row split into the
 * collection photo and the shelf designer, and a label in every title blob.
 */
export default function HomeC() {
  return (
    <>
      <HeroStatic />
      <CollectionRows />
      <CustomProjectSection />
      <AboutSection />
    </>
  )
}
