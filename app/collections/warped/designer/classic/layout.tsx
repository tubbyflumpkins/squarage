import type { Metadata } from 'next'

// The designer as it was before the 2026-10 redesign, kept reachable so the two can be compared
// side by side. Not a public page: noindex, and deliberately absent from app/sitemap.ts. The
// canonical it inherits from the designer's layout points at the real designer, which is right
// for a duplicate.
export const metadata: Metadata = {
  title: 'Shelf Designer (classic)',
  robots: { index: false, follow: false },
}

export default function ClassicDesignerLayout({ children }: { children: React.ReactNode }) {
  return children
}
