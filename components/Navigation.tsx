'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import CartIcon from '@/components/CartIcon'
import { useCart } from '@/context/CartContext'

// Shared icon components to reduce bundle size
const EmailIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
  </svg>
)

const InstagramIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { toggleCart, closeCart, state } = useCart()
  const pathname = usePathname()
  
  // Use special logo on custom-projects and contact pages
  const useSpecialLogo = pathname === '/custom-projects' || pathname === '/contact'
  const logoSrc = useSpecialLogo ? '/images/logo_main_white_transparent.png' : '/images/logo_main.png'
  
  // Handle back button/swipe to close menus
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isMenuOpen || state.isOpen) {
        if (isMenuOpen) {
          setIsMenuOpen(false)
        }
        if (state.isOpen) {
          closeCart()
        }
        
        // Prevent navigation
        window.history.pushState(null, '', window.location.href)
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isMenuOpen, state.isOpen, closeCart])
  
  // Handle cart toggle - close menu if open  
  const handleCartToggle = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false)
    }
    const wasOpen = state.isOpen
    toggleCart()
    
    // Add history state when opening cart
    if (!wasOpen) {
      setTimeout(() => {
        window.history.pushState(null, '', window.location.href)
      }, 0)
    }
  }
  
  // Handle menu toggle - close cart if open
  const handleMenuToggle = () => {
    if (state.isOpen) {
      closeCart()
    }
    const newMenuState = !isMenuOpen
    setIsMenuOpen(newMenuState)
    
    // Add history state when opening menu
    if (newMenuState) {
      window.history.pushState(null, '', window.location.href)
    }
  }

  // Menu item shared classes
  const menuItemClass = "block text-4xl md:text-5xl font-bold font-neue-haas text-white hover:text-squarage-red hover:scale-105 transition-all duration-300 relative group"
  const shadowTextClass = "absolute inset-0 text-squarage-yellow transform translate-x-1 translate-y-1 -z-10"

  return (
    <>
      {/* Floating Logo - Independent Element */}
      <Link 
        href="/" 
        className="fixed top-6 left-6 z-[9999] hover:scale-105 transition-transform duration-300"
        style={{ isolation: 'isolate' }}
        onClick={(e) => {
          // If any menu is open, close it and prevent navigation
          if (isMenuOpen || state.isOpen) {
            e.preventDefault()
            if (isMenuOpen) {
              setIsMenuOpen(false)
            }
            if (state.isOpen) {
              closeCart()
            }
          }
          // If no menus are open, allow normal navigation to home
        }}
      >
        <Image
          src={logoSrc}
          alt="Squarage Studio"
          width={480}
          height={114}
          className="w-auto h-12 sm:h-16 md:h-20 lg:h-24 drop-shadow-lg"
          priority
        />
      </Link>

      {/* Cart Icon */}
      <CartIcon onClick={handleCartToggle} />

      {/* Floating Menu Button - Independent Element */}
      <button
        onClick={handleMenuToggle}
        className={`fixed top-6 right-6 md:right-10 flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 space-y-1 group z-[9999] md:hover:scale-110 transition-all duration-300 drop-shadow-lg ${
          useSpecialLogo ? 'bg-white' : 'bg-squarage-green'
        }`}
        aria-label="Toggle menu"
        style={{ isolation: 'isolate' }}
      >
        <span className={`block h-0.5 w-4 sm:h-1 sm:w-5 md:h-1 md:w-6 transition-all duration-300 md:group-hover:w-7 md:group-hover:-translate-y-0.5 ${
          useSpecialLogo ? 'bg-squarage-red' : 'bg-white'
        }`} />
        <span className={`block h-0.5 w-4 sm:h-1 sm:w-5 md:h-1 md:w-6 transition-all duration-300 md:group-hover:w-7 ${
          useSpecialLogo ? 'bg-squarage-red' : 'bg-white'
        }`} />
        <span className={`block h-0.5 w-4 sm:h-1 sm:w-5 md:h-1 md:w-6 transition-all duration-300 md:group-hover:w-7 md:group-hover:translate-y-0.5 ${
          useSpecialLogo ? 'bg-squarage-red' : 'bg-white'
        }`} />
      </button>

      {/* Click Outside to Close Overlay - Remaining Space */}
      {isMenuOpen && (
        <div 
          className="fixed top-0 left-0 h-full z-[9990] bg-transparent"
          style={{ width: 'calc(100% - min(480px, 100vw))' }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Fixed-Width Menu Sliding In */}
      <div
        className={`fixed top-0 h-full z-[9995] bg-squarage-green transition-transform duration-300 ease-out drop-shadow-2xl ${
          isMenuOpen 
            ? 'translate-x-0' 
            : 'translate-x-full'
        }`}
        style={{
          right: 0,
          width: 'min(480px, 100vw)',
          isolation: 'isolate',
          willChange: isMenuOpen ? 'transform' : 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-start h-full pt-24 pl-12">
          <nav className="text-left">
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  <span className={shadowTextClass}>Home</span>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  <span className={shadowTextClass}>Products</span>
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  <span className={shadowTextClass}>Collections</span>
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-projects"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  <span className={shadowTextClass}>Custom Projects</span>
                  Custom Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  <span className={shadowTextClass}>Contact</span>
                  Contact
                </Link>
              </li>
            </ul>

            {/* Contact Icons */}
            <div className="mt-8 flex gap-8">
              {/* Email Icon */}
              <a 
                href="mailto:squaragestudio@gmail.com"
                className="relative group hover:text-squarage-red hover:scale-125 transition-all duration-300"
                aria-label="Email us"
              >
                <EmailIcon className="absolute w-10 h-10 text-squarage-yellow transform translate-x-1 translate-y-1 -z-10" />
                <EmailIcon className="w-10 h-10 text-white group-hover:text-squarage-red relative z-10 transition-colors duration-300" />
              </a>
              
              {/* Instagram Icon */}
              <a 
                href="https://instagram.com/squaragestudio"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group hover:text-squarage-red hover:scale-125 transition-all duration-300"
                aria-label="Follow us on Instagram"
              >
                <InstagramIcon className="absolute w-10 h-10 text-squarage-yellow transform translate-x-1 translate-y-1 -z-10" />
                <InstagramIcon className="w-10 h-10 text-white group-hover:text-squarage-red relative z-10 transition-colors duration-300" />
              </a>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}