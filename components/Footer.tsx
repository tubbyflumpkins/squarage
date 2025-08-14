'use client'

import Image from 'next/image'
import Link from 'next/link'

const EmailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
  </svg>
)

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-squarage-green text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="pt-16 pb-4 flex justify-center">
          <Image
            src="/images/logo_main_white_transparent.png"
            alt="Squarage Studio"
            width={800}
            height={320}
            className="w-2/3 h-auto"
          />
        </div>

        {/* Main Footer Content */}
        <div className="w-2/3 mx-auto pb-6">
          {/* Mobile: Shop and Info side by side, Connect below */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {/* Shop Column */}
            <div className="text-center">
              <h3 className="font-neue-haas font-bold text-xl md:text-2xl mb-2">Shop</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/collections/tiled" className="text-lg md:text-xl opacity-90 hover:opacity-100 transition-opacity">
                    Tiled Collection
                  </Link>
                </li>
                <li>
                  <Link href="/collections/warped" className="text-lg md:text-xl opacity-90 hover:opacity-100 transition-opacity">
                    Warped Collection
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-lg md:text-xl opacity-90 hover:opacity-100 transition-opacity">
                    All Products
                  </Link>
                </li>
              </ul>
            </div>

            {/* Information Column */}
            <div className="text-center">
              <h3 className="font-neue-haas font-bold text-xl md:text-2xl mb-2">Information</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/custom-projects" className="text-lg md:text-xl opacity-90 hover:opacity-100 transition-opacity">
                    Custom Projects
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-lg md:text-xl opacity-90 hover:opacity-100 transition-opacity">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect Column - spans full width on mobile */}
            <div className="text-center col-span-2 md:col-span-1 mt-4 md:mt-0">
              <h3 className="font-neue-haas font-bold text-xl md:text-2xl mb-2">Connect</h3>
              <div className="flex gap-6 justify-center">
                {/* Email Icon */}
                <a 
                  href="mailto:squaragestudio@gmail.com"
                  className="hover:text-squarage-yellow hover:scale-125 transition-all duration-300"
                  aria-label="Email us"
                >
                  <EmailIcon className="w-8 h-8" />
                </a>
                
                {/* Instagram Icon */}
                <a 
                  href="https://instagram.com/squaragestudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-squarage-yellow hover:scale-125 transition-all duration-300"
                  aria-label="Follow us on Instagram"
                >
                  <InstagramIcon className="w-8 h-8" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm opacity-70">
              © {currentYear} Squarage Studio LLC. All rights reserved.
            </p>
            <p className="text-sm opacity-70">
              Made in Los Angeles
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}