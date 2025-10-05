'use client'

import { useState, useEffect } from 'react'
import { useEmailCapture } from '@/context/EmailCaptureContext'


export default function EmailCapturePopup() {
  const { showPopup, closePopup, submitEmail } = useEmailCapture()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  // Reset form when popup opens
  useEffect(() => {
    if (showPopup) {
      setEmail('')
      setErrorMessage('')
      setShowSuccess(false)
      setSuccessMessage('')
      setDiscountCode('')
      setCodeCopied(false)
    }
  }, [showPopup])

  if (!showPopup) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    // Always pass true for consent since we're removing the checkbox
    const result = await submitEmail(email, true)

    if (result.success) {
      // Check if this is an existing subscriber based on the message
      const isExisting = result.message?.toLowerCase().includes('already') ||
                        result.message?.toLowerCase().includes('existing')

      if (isExisting) {
        // For existing subscribers, show a different message without the code
        setSuccessMessage("You're already subscribed! We've sent your discount code to your email.")
        setDiscountCode('') // Don't show the code again
      } else {
        // For new subscribers, show the discount code
        setSuccessMessage(result.message || 'Successfully subscribed!')
        setDiscountCode(result.discountCode || '')
      }
      setShowSuccess(true)
      setIsSubmitting(false)
    } else {
      setErrorMessage(result.message)
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = async () => {
    if (discountCode) {
      try {
        await navigator.clipboard.writeText(discountCode)
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={closePopup}
      />

      {/* Popup */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cream w-[90%] max-w-md shadow-2xl z-50 rounded-lg overflow-hidden">
        <div className="relative p-6 sm:p-8">
          {/* Close button */}
          <button
            onClick={closePopup}
            className="absolute right-4 top-4 text-squarage-black/50 hover:text-squarage-black transition-colors z-10"
            aria-label="Close popup"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Success State */}
          {showSuccess ? (
            <div className="text-center py-4 animate-fadeIn">
              {/* Animated Checkmark */}
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-full h-full" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="#ff962d"
                    strokeWidth="3"
                    className="animate-drawCircle"
                  />
                  <path
                    d="M 22 40 L 33 50 L 55 28"
                    fill="none"
                    stroke="#ff962d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-drawCheck"
                  />
                </svg>
              </div>

              {/* Show discount code if available */}
              {discountCode ? (
                <>
                  {/* Success Message for New Subscribers */}
                  <h3 className="text-2xl font-bold font-neue-haas text-squarage-green mb-2">
                    Thank You!
                  </h3>
                  <p className="text-base font-neue-haas text-squarage-black mb-4">
                    Your exclusive 10% off code:
                  </p>

                  {/* Discount Code Display */}
                  <div className="relative mb-6">
                    <div className="bg-white border-2 border-dashed border-squarage-orange rounded-lg p-4 mb-3">
                      <div className="text-2xl sm:text-3xl font-bold font-neue-haas text-squarage-orange tracking-wider">
                        {discountCode}
                      </div>
                    </div>

                    {/* Copy Code Button */}
                    <button
                      onClick={() => {
                        handleCopyCode();
                        // Close popup after successful copy
                        if (!codeCopied) {
                          setTimeout(() => closePopup(), 2000);
                        }
                      }}
                      className={`w-full px-4 py-3 font-bold font-neue-haas text-base transition-all duration-200 rounded-full ${
                        codeCopied
                          ? 'bg-green-500 text-white'
                          : 'bg-squarage-orange text-white hover:bg-orange hover:scale-105'
                      }`}
                    >
                      {codeCopied ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied! Closing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Code & Close
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Email Note */}
                  <p className="text-xs font-neue-haas text-squarage-black/50">
                    We've also emailed this code to you
                  </p>
                </>
              ) : (
                <>
                  {/* Message for Existing Subscribers */}
                  <h3 className="text-xl sm:text-2xl font-bold font-neue-haas text-squarage-green mb-3">
                    Welcome Back!
                  </h3>
                  <p className="text-base font-neue-haas text-squarage-black mb-6">
                    {successMessage}
                  </p>

                  {/* Continue Button for existing subscribers */}
                  <button
                    onClick={closePopup}
                    className="w-full px-6 py-3 bg-squarage-orange text-white font-bold font-neue-haas text-base hover:bg-orange transition-all duration-200 rounded-full shadow-sm hover:shadow-md hover:scale-105"
                  >
                    Continue Shopping
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Form State */}
              <div className={`transition-opacity duration-300 ${isSubmitting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Content */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold font-neue-haas text-squarage-green mb-3">
                    Get 10% Off Your First Order
                  </h2>
                  <p className="text-base sm:text-lg font-neue-haas text-squarage-black">
                    Join our newsletter for exclusive offers and new arrivals.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email input */}
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 bg-white/90 backdrop-blur border border-squarage-black/10 rounded-full font-neue-haas text-base text-squarage-black placeholder:text-squarage-black/50 focus:outline-none focus:border-squarage-orange transition-colors"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <p className="text-sm font-neue-haas text-red-600 text-center animate-shake">
                      {errorMessage}
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-squarage-orange text-white font-bold font-neue-haas text-base hover:bg-orange transition-all duration-200 rounded-full shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Get My Discount
                  </button>
                </form>
              </div>

              {/* Loading State Overlay */}
              {isSubmitting && (
                <div className="absolute inset-0 flex items-center justify-center bg-cream">
                  <div className="relative">
                    {/* Spinner */}
                    <div className="w-16 h-16 border-3 border-squarage-orange/30 border-t-squarage-orange rounded-full animate-spin" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes drawCircle {
          from {
            stroke-dasharray: 220;
            stroke-dashoffset: 220;
          }
          to {
            stroke-dasharray: 220;
            stroke-dashoffset: 0;
          }
        }

        @keyframes drawCheck {
          from {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
          }
          to {
            stroke-dasharray: 50;
            stroke-dashoffset: 0;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-drawCircle {
          animation: drawCircle 0.6s ease-out forwards;
        }

        .animate-drawCheck {
          animation: drawCheck 0.4s ease-out 0.4s forwards;
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
        }

        .animate-shake {
          animation: shake 0.5s;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </>
  )
}