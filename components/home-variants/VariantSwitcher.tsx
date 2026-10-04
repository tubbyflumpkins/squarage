import Link from 'next/link'

const OPTIONS = [
  { key: 'current', label: 'Current' },
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B' },
  { key: 'c', label: 'C' },
]

/** Temporary: flips between the homepage versions under review. Goes when one is picked. */
export default function VariantSwitcher({ current }: { current: string }) {
  return (
    <nav
      aria-label="Homepage versions"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9970] flex gap-1 rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur"
    >
      {OPTIONS.map(({ key, label }) => (
        <Link
          key={key}
          href={`/?v=${key}`}
          scroll={false}
          aria-current={key === current ? 'page' : undefined}
          className={`rounded-full px-4 py-1.5 font-neue-haas text-sm font-medium transition-colors ${
            key === current ? 'bg-squarage-green text-white' : 'text-squarage-black hover:bg-gray-100'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
