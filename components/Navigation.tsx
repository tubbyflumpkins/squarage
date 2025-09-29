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

const BagIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

// Test button component for development only
function EmailTestButton() {
  const [cleared, setCleared] = useState(false)

  // Only render in development mode
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const handleReset = () => {
    localStorage.removeItem('email_popup_dismissed')
    localStorage.removeItem('email_popup_submitted')
    localStorage.removeItem('email_popup_last_visit')
    localStorage.removeItem('email_popup_discount_code')
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
    // Reload page to trigger popup again
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <button
      onClick={handleReset}
      className={`px-3 py-1.5 rounded-full font-neue-haas text-xs font-medium transition-all duration-200 ${
        cleared
          ? 'bg-green-500 text-white'
          : 'bg-squarage-orange text-white hover:bg-orange'
      }`}
      title="Clear email popup localStorage and reload"
    >
      {cleared ? '✓' : '🧪 Reset'}
    </button>
  )
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { toggleCart, closeCart, state } = useCart()
  const pathname = usePathname()
  
  // Use white logo only on contact page
  const useSpecialLogo = pathname === '/contact'
  const logoSrc = useSpecialLogo ? '/images/logo_main_white_transparent_small.png' : '/images/logo_main_small.png'
  
  // Check if we're on specific pages
  const isTiledPage = pathname === '/collections/tiled'
  const isWarpedPage = pathname === '/collections/warped'
  const isContactPage = pathname === '/contact'
  const isHomePage = pathname === '/'
  
  
  // Handle scroll for desktop nav background
  useEffect(() => {
    const handleScroll = (element?: Element) => {
      // Check multiple scroll sources
      const windowScroll = window.scrollY || window.pageYOffset
      const docScroll = document.documentElement.scrollTop
      const bodyScroll = document.body.scrollTop
      const elementScroll = element ? element.scrollTop : 0
      
      const scrollY = Math.max(windowScroll, docScroll, bodyScroll, elementScroll)
      const scrolled = scrollY > 0
      
      // Only update if scroll state actually changes
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled)
      }
    }
    
    // Check initial scroll position
    handleScroll()
    
    // Add listeners to window/document
    const windowScrollHandler = () => handleScroll()
    window.addEventListener('scroll', windowScrollHandler, false)
    document.addEventListener('scroll', windowScrollHandler, false)
    
    // Listen to body scroll specifically (this is what actually scrolls on Warped page)
    const bodyScrollHandler = () => handleScroll(document.body)
    document.body.addEventListener('scroll', bodyScrollHandler, false)
    
    // Listen to html scroll
    const htmlScrollHandler = () => handleScroll(document.documentElement)
    document.documentElement.addEventListener('scroll', htmlScrollHandler, false)
    
    return () => {
      window.removeEventListener('scroll', windowScrollHandler)
      document.removeEventListener('scroll', windowScrollHandler)
      document.body.removeEventListener('scroll', bodyScrollHandler)
      document.documentElement.removeEventListener('scroll', htmlScrollHandler)
    }
  }, [pathname, isWarpedPage, isTiledPage, isHomePage, isScrolled])
  
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
  const menuItemClass = "block text-4xl md:text-5xl font-bold font-neue-haas text-white hover:text-squarage-red hover:scale-105 transition-all duration-300"

  // Build header styles and classes
  let headerStyle: React.CSSProperties = {}
  let headerClasses = 'hidden md:block fixed top-0 left-0 right-0 z-[9990]'

  // Apply page-specific styling
  if (isWarpedPage || isTiledPage || isHomePage) {
    // For Warped, Tiled, and Home pages, use inline styles for background transition (no shadow)
    headerStyle = {
      backgroundColor: isScrolled ? '#fffaf4' : 'transparent',
      transition: 'background-color 0.3s ease'
    }
  } else if (isContactPage) {
    // Contact page has red background
    headerClasses += ' bg-squarage-red'
  } else {
    // All other pages have cream background (no shadow)
    headerClasses += ' bg-cream'
  }


  return (
    <>
      {/* Desktop Navigation Bar */}
      <div 
        className={headerClasses}
        style={headerStyle}
      >
        <div className="flex items-center px-6 py-6">
          {/* Logo */}
          <Link 
            href="/" 
            className="hover:scale-105 transition-transform duration-300 flex-shrink-0 mr-12"
            onClick={(e) => {
              if (state.isOpen) {
                e.preventDefault()
                closeCart()
              }
            }}
          >
            <Image
              src={logoSrc}
              alt="Squarage Studio"
              width={254}
              height={61}
              className="w-auto h-[42px] lg:h-[50px]"
              priority
            />
          </Link>
          
          {/* Desktop Menu Items - aligned left after logo */}
          <nav className="flex items-center gap-4 lg:gap-6 flex-1">
            <Link
              href="/products"
              className={`font-neue-haas font-medium text-xl lg:text-2xl ${
                isContactPage ? 'text-white hover:text-squarage-orange' : 'text-squarage-green hover:text-squarage-orange'
              } transition-colors duration-200`}
            >
              Catalog
            </Link>
            <Link
              href="/collections/warped"
              className={`font-neue-haas font-medium text-xl lg:text-2xl ${
                isContactPage ? 'text-white hover:text-squarage-orange' : 'text-squarage-green hover:text-squarage-orange'
              } transition-colors duration-200`}
            >
              Warped
            </Link>
            <Link
              href="/collections/tiled"
              className={`font-neue-haas font-medium text-xl lg:text-2xl ${
                isContactPage ? 'text-white hover:text-squarage-orange' : 'text-squarage-green hover:text-squarage-orange'
              } transition-colors duration-200`}
            >
              Tiled
            </Link>
            <Link
              href="/custom-projects"
              className={`font-neue-haas font-medium text-xl lg:text-2xl ${
                isContactPage ? 'text-white hover:text-squarage-orange' : 'text-squarage-green hover:text-squarage-orange'
              } transition-colors duration-200`}
            >
              Custom
            </Link>
            <Link
              href="/contact"
              className={`font-neue-haas font-medium text-xl lg:text-2xl ${
                isContactPage ? 'text-white hover:text-squarage-orange' : 'text-squarage-green hover:text-squarage-orange'
              } transition-colors duration-200`}
            >
              Contact
            </Link>

            {/* Test Reset Button - Development Only */}
            <div className="ml-4">
              <EmailTestButton />
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Floating Logo - Mobile */}
        <Link 
          href="/" 
          className="fixed top-6 left-6 z-[10005] hover:scale-105 transition-transform duration-300"
          style={{ isolation: 'isolate' }}
          onClick={(e) => {
            if (isMenuOpen || state.isOpen) {
              e.preventDefault()
              if (isMenuOpen) {
                setIsMenuOpen(false)
              }
              if (state.isOpen) {
                closeCart()
              }
            }
          }}
        >
          <Image
            src={logoSrc}
            alt="Squarage Studio"
            width={254}
            height={61}
            className="w-auto h-[26px] sm:h-[34px] drop-shadow-lg"
            priority
          />
        </Link>

        {/* Cart Icon - Mobile */}
        <div className="md:hidden">
          <CartIcon onClick={handleCartToggle} />
        </div>

        {/* Floating Menu Button - Mobile Only */}
        <button
          onClick={handleMenuToggle}
          className={`fixed top-6 right-6 flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 space-y-1 group z-[10005] transition-all duration-300 drop-shadow-lg ${
            useSpecialLogo ? 'bg-white' : 'bg-squarage-green'
          }`}
          aria-label="Toggle menu"
          style={{ isolation: 'isolate' }}
        >
          <span className={`block h-0.5 w-4 sm:h-1 sm:w-5 transition-all duration-300 ${
            useSpecialLogo ? 'bg-squarage-red' : 'bg-white'
          }`} />
          <span className={`block h-0.5 w-4 sm:h-1 sm:w-5 transition-all duration-300 ${
            useSpecialLogo ? 'bg-squarage-red' : 'bg-white'
          }`} />
          <span className={`block h-0.5 w-4 sm:h-1 sm:w-5 transition-all duration-300 ${
            useSpecialLogo ? 'bg-squarage-red' : 'bg-white'
          }`} />
        </button>
      </div>

      {/* Click Outside to Close Overlay - Remaining Space */}
      {isMenuOpen && (
        <div 
          className="fixed top-0 left-0 h-full z-[9980] bg-transparent"
          style={{ width: 'calc(100% - min(480px, 100vw))' }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Fixed-Width Menu Sliding In */}
      <div
        className={`fixed top-0 h-full z-[9985] bg-squarage-green transition-transform duration-300 ease-out drop-shadow-2xl ${
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
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  Catalog
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/warped"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  Warped
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/tiled"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  Tiled
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-projects"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  Custom
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className={menuItemClass}
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Contact Icons */}
            <div className="mt-8 flex gap-8">
              {/* Email Icon */}
              <a 
                href="mailto:hello@squarage.com"
                className="hover:text-squarage-red hover:scale-125 transition-all duration-300"
                aria-label="Email us"
              >
                <EmailIcon className="w-10 h-10 text-white hover:text-squarage-red transition-colors duration-300" />
              </a>
              
              {/* Instagram Icon */}
              <a 
                href="https://instagram.com/squaragestudio"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-squarage-red hover:scale-125 transition-all duration-300"
                aria-label="Follow us on Instagram"
              >
                <InstagramIcon className="w-10 h-10 text-white hover:text-squarage-red transition-colors duration-300" />
              </a>
            </div>
          </nav>
        </div>
      </div>

      {/* Floating Desktop Cart Button - Separate from header, always on top */}
      <button
        onClick={handleCartToggle}
        className={`hidden md:flex fixed top-6 right-6 items-center justify-center w-12 h-12 ${
          isContactPage ? 'bg-white' : 'bg-squarage-green'
        } hover:scale-110 transition-all duration-300 z-[10003] drop-shadow-lg`}
        aria-label="Shopping cart"
      >
        <BagIcon className={`w-6 h-6 ${isContactPage ? 'text-squarage-red' : 'text-white'}`} />
        
        {/* Cart count badge */}
        {state.totalQuantity > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-squarage-orange text-white text-xs font-bold rounded-full">
            {state.totalQuantity > 9 ? '9+' : state.totalQuantity}
          </span>
        )}
      </button>
    </>
  )
}