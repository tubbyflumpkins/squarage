'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="flex items-start justify-between p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo_main.png"
              alt="Squarage Studio"
              width={480}
              height={114}
              className="w-auto h-24 md:h-30"
              priority
            />
          </Link>

          {/* Menu Button */}
          <button
            onClick={toggleMenu}
            className="flex flex-col items-center justify-center w-12 h-12 bg-squarage-green space-y-1 group relative z-50"
            aria-label="Toggle menu"
          >
            <span 
              className={`block h-1 w-6 bg-white transition-all duration-300 group-hover:w-7 group-hover:-translate-y-0.5 ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span 
              className={`block h-1 w-6 bg-white transition-all duration-300 group-hover:w-7 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span 
              className={`block h-1 w-6 bg-white transition-all duration-300 group-hover:w-7 group-hover:translate-y-0.5 ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-cream transition-all duration-500 ${
          isMenuOpen 
            ? 'opacity-100 visible' 
            : 'opacity-0 invisible'
        }`}
      >
        <div className="flex items-center justify-center h-full">
          <nav className="text-center relative z-60">
            <ul className="space-y-8">
              <li>
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-thin font-neue-haas text-squarage-black hover:text-squarage-green transition-colors duration-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-thin font-neue-haas text-squarage-black hover:text-squarage-green transition-colors duration-300"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-thin font-neue-haas text-squarage-black hover:text-squarage-green transition-colors duration-300"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/custom-projects"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-thin font-neue-haas text-squarage-black hover:text-squarage-green transition-colors duration-300"
                >
                  Custom Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-thin font-neue-haas text-squarage-black hover:text-squarage-green transition-colors duration-300"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-thin font-neue-haas text-squarage-black hover:text-squarage-green transition-colors duration-300"
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Contact Info */}
            <div className="mt-16 space-y-4">
              <p className="text-lg font-neue-haas text-brown-light">
                <a 
                  href="mailto:squaragestudio@gmail.com"
                  className="hover:text-squarage-green transition-colors duration-300"
                >
                  squaragestudio@gmail.com
                </a>
              </p>
              <p className="text-lg font-neue-haas text-brown-light">
                <a 
                  href="https://instagram.com/squaragestudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-squarage-green transition-colors duration-300"
                >
                  @squaragestudio
                </a>
              </p>
              <p className="text-sm font-neue-haas text-brown-light uppercase tracking-wider">
                Los Angeles, CA
              </p>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}