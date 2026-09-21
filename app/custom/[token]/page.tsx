import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import SharedDesignView from '@/components/shelf/SharedDesignView'
import { fetchSharedDesign } from '@/lib/sharedDesignServer'

// A custom design prepared for one customer, reached only by the link Dylan sends them.
// Deliberately NOT in app/sitemap.ts, and noindex: the token in the URL is the only thing
// keeping the page private. Always rendered per request, since the price, notes and paid
// status change under the same link.
export const dynamic = 'force-dynamic'

// One labs fetch per request, shared by generateMetadata and the page
const getShare = cache((token: string) => fetchSharedDesign(token))

interface SharedDesignPageProps {
  params: Promise<{ token: string }>
  // ?option=2 opens a link with several options on that one (labs' draft orders link this way)
  searchParams: Promise<{ option?: string | string[] }>
}

export async function generateMetadata({ params }: SharedDesignPageProps): Promise<Metadata> {
  const { token } = await params
  // No customer name and no design details: link previews in chat apps show this
  const title = 'Your Custom Design'
  const description = 'A custom Warped shelf, designed for you by Squarage Studio.'
  return {
    title,
    description,
    robots: { index: false, follow: false },
    // app/custom/layout.tsx canonicalises to /custom, which this page is not
    alternates: { canonical: `https://www.squarage.com/custom/${token}` },
    openGraph: { title, description, images: ['/images/og/home.jpg'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og/home.jpg'] },
  }
}

export default async function SharedDesignPage({ params, searchParams }: SharedDesignPageProps) {
  const { token } = await params
  const { option } = await searchParams
  const initialOption = typeof option === 'string' && /^\d{1,2}$/.test(option) ? Number(option) : undefined
  const result = await getShare(token)

  // Outside any try/catch: notFound() works by throwing
  if (result.status === 'not_found') notFound()

  if (result.status === 'unavailable') {
    return (
      <div className="min-h-[100dvh] bg-cream flex items-center justify-center px-6 pt-[60px] md:pt-[90px] lg:pt-[98px]">
        <div className="max-w-md text-center">
          <h1 className="text-[28px] md:text-[42px] font-bold tracking-[0.02em] text-squarage-black">We could not load your design</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-squarage-black/80">
            Something went wrong on our side. Please try this link again in a minute.
          </p>
        </div>
      </div>
    )
  }

  return <SharedDesignView share={result.share} initialOption={initialOption} />
}
