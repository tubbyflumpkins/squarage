'use client'

import { useState, useEffect } from 'react'
import { useCookieConsent } from '@/context/CookieConsentContext'
import { cookieCategories, ConsentState } from '@/lib/cookieCategories'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ManageCookiesModal() {
  const { showModal, consent, closeModal, savePreferences, acceptAll } = useCookieConsent()
  const [localConsent, setLocalConsent] = useState<ConsentState>(consent)

  useEffect(() => {
    setLocalConsent(consent)
  }, [consent])

  if (!showModal) return null

  const handleToggle = (categoryId: keyof ConsentState) => {
    if (categoryId === 'necessary') return // Can't toggle necessary cookies
    
    setLocalConsent(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handleSavePreferences = () => {
    savePreferences(localConsent)
  }

  const handleAcceptAll = () => {
    acceptAll()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[10000] transition-opacity"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div
        className={`fixed top-0 h-full z-[10001] bg-cream transition-transform duration-300 ease-out drop-shadow-2xl ${
          showModal ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          right: 0,
          width: 'min(480px, 100vw)',
          isolation: 'isolate',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-squarage-black">
            <h2 className="text-2xl font-bold font-neue-haas text-squarage-black">
              Cookie Preferences
            </h2>
            <button
              onClick={closeModal}
              className="p-1 hover:bg-squarage-black/5 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6 text-squarage-black" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-6">
              <p className="text-base font-neue-haas text-squarage-black/80">
                We use cookies to enhance your experience on our website. 
                You can manage your preferences below. Some cookies are necessary 
                for the site to function and cannot be disabled.
              </p>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-6">
              {cookieCategories.map((category) => (
                <div key={category.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg font-bold font-neue-haas text-squarage-black mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm font-neue-haas text-squarage-black/70">
                        {category.description}
                      </p>
                    </div>
                    
                    {/* Toggle Switch */}
                    <label className={`relative inline-flex items-center ${category.required ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={localConsent[category.id as keyof ConsentState]}
                        onChange={() => handleToggle(category.id as keyof ConsentState)}
                        disabled={category.required}
                        className="sr-only peer"
                      />
                      <div className={`
                        w-14 h-7 rounded-full transition-colors duration-200
                        ${category.required 
                          ? 'bg-squarage-black/30' 
                          : 'bg-gray-300 peer-checked:bg-squarage-orange'
                        }
                        peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-squarage-orange/50
                      `}>
                        <div className={`
                          absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full 
                          transition-transform duration-200 shadow-sm
                          ${localConsent[category.id as keyof ConsentState] ? 'translate-x-7' : 'translate-x-0'}
                        `} />
                      </div>
                    </label>
                  </div>
                  
                  {/* Additional info for specific categories */}
                  {category.id === 'analytics' && (
                    <div className="mt-3 text-xs font-neue-haas text-squarage-black/60">
                      <p>Includes: Google Analytics, Microsoft Clarity</p>
                    </div>
                  )}
                  {category.id === 'marketing' && (
                    <div className="mt-3 text-xs font-neue-haas text-squarage-black/60">
                      <p>Includes: Future advertising and remarketing services</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="border-t-2 border-squarage-black px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-6 py-2.5 bg-white text-squarage-black border-2 border-squarage-black font-medium font-neue-haas text-base hover:bg-cream transition-colors duration-200"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-6 py-2.5 bg-squarage-orange text-white font-medium font-neue-haas text-base hover:bg-orange transition-colors duration-200"
              >
                Accept All
              </button>
            </div>
            
            {/* Privacy Link */}
            <div className="mt-4 text-center">
              <a 
                href="/customer-service#privacy" 
                className="text-sm font-neue-haas text-squarage-orange hover:text-orange underline"
                onClick={() => {
                  closeModal()
                }}
              >
                View our Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}