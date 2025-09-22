'use client'

import { useCookieConsent } from '@/context/CookieConsentContext'

export default function CookieBanner() {
  const { showBanner, acceptAll, openModal, closeBanner } = useCookieConsent()

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-cream border-t-2 border-squarage-black z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Text Content */}
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold font-neue-haas text-squarage-black mb-2">
                We value your privacy
              </h3>
              <p className="text-sm sm:text-base font-neue-haas text-squarage-black/80">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                By clicking &ldquo;Accept All&rdquo;, you consent to our use of cookies.
              </p>
              <a 
                href="/customer-service#privacy" 
                className="text-sm font-neue-haas text-squarage-orange hover:text-orange underline inline-block mt-2"
                onClick={(e) => {
                  e.preventDefault()
                  closeBanner()
                  window.location.href = '/customer-service#privacy'
                }}
              >
                Learn more about our Privacy Policy
              </a>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={openModal}
                className="px-6 py-2.5 bg-white text-squarage-black border-2 border-squarage-black font-medium font-neue-haas text-base hover:bg-cream transition-colors duration-200 order-2 sm:order-1"
              >
                Manage Cookies
              </button>
              <button
                onClick={acceptAll}
                className="px-6 py-2.5 bg-squarage-orange text-white font-medium font-neue-haas text-base hover:bg-orange transition-colors duration-200 order-1 sm:order-2"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}