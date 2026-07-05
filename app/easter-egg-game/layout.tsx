import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Easter Egg Game',
  robots: {
    index: false,
    follow: false,
  },
}

export default function EasterEggGameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
