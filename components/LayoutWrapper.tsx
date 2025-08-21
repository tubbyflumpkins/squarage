'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SimplePreloader from '@/components/SimplePreloader'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isEasterEggGame = pathname === '/easter-egg-game'

  return (
    <>
      <SimplePreloader />
      <Navigation />
      <CartDrawer />
      {children}
      {!isEasterEggGame && <Footer />}
    </>
  )
}