'use client'

/** The "Want a Custom Piece?" band from the current homepage, without its button:
    the designer hero that follows is the call to action. Desktop only: on a
    phone the hero stands alone under the collections' yellow bar. */
export default function CustomPieceTitle() {
  return (
    <section className="hidden md:block bg-squarage-green">
      <div className="py-12 lg:py-14 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-neue-haas font-black text-white">
            Want a Custom Piece?
          </h2>
        </div>
      </div>
    </section>
  )
}
