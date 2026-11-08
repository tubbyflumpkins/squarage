'use client'

import DesignerHero from '@/components/custom/DesignerHero'
import MoreSpecificSection from '@/components/custom/MoreSpecificSection'

/** The bottom of the homepage: /custom folded in. On desktop the green
    "Want a Custom Piece?" band leads into the designer hero; on a phone the
    hero stands alone under the collections' yellow bar. Then "Need Something
    More Specific?" on yellow, before About Us. */
export default function CustomProjectSection() {
  return (
    <>
      <section className="hidden md:block bg-squarage-green">
        <div className="py-12 lg:py-14 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-neue-haas font-black text-white">
              Want a Custom Piece?
            </h2>
          </div>
        </div>
      </section>
      <DesignerHero />
      <MoreSpecificSection />
    </>
  )
}
