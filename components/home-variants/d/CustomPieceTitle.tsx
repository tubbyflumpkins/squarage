'use client'

/** The "Want a Custom Piece?" band from the current homepage, without its button:
    the designer hero that follows is the call to action. On a phone it sits on
    cream under the collections' yellow bar; on desktop it is the green band. */
export default function CustomPieceTitle() {
  return (
    <section className="bg-cream md:bg-squarage-green">
      <div className="pt-8 pb-2 md:py-12 lg:py-14 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-neue-haas font-black text-squarage-black md:text-white">
            Want a Custom Piece?
          </h2>
        </div>
      </div>
    </section>
  )
}
