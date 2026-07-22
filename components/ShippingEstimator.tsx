'use client'

import { useState, useCallback, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function ShippingEstimator() {
  const [zipCode, setZipCode] = useState('')
  const [shippingStatus, setShippingStatus] = useState<{
    available: boolean
    message: string
    isLocal?: boolean
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoChecked, setAutoChecked] = useState(false)

  // Fill the ZIP on mount: a previously saved ZIP wins; otherwise ask
  // /api/geo for an approximate one from Vercel's IP geolocation headers
  // (US only — the checker only understands US ZIPs). Does nothing when
  // neither source is available, e.g. on localhost.
  useEffect(() => {
    if (autoChecked) return

    const getStoredZip = () => {
      // Check localStorage first
      const storedZip = localStorage.getItem('userZipCode')
      if (storedZip) {
        return storedZip
      }

      // Check cookies (if you have a cookie utility)
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'zipCode') {
          return decodeURIComponent(value)
        }
      }

      return null
    }

    const storedZip = getStoredZip()
    if (storedZip) {
      setZipCode(storedZip)
      // Auto-calculate for stored ZIP
      setTimeout(() => {
        calculateShipping(storedZip)
        setAutoChecked(true)
      }, 500)
      return
    }

    let cancelled = false
    fetch('/api/geo')
      .then((res) => (res.ok ? res.json() : null))
      .then((geo) => {
        if (cancelled || !geo) return
        if (geo.country === 'US' && /^\d{5}$/.test(geo.postalCode || '')) {
          // Don't clobber anything the user typed while the lookup was in flight.
          let applied = false
          setZipCode((prev) => {
            if (prev) return prev
            applied = true
            return geo.postalCode
          })
          if (applied) calculateShipping(geo.postalCode)
        }
      })
      .catch(() => {
        // Geo headers unavailable (localhost) or network hiccup — leave the field empty.
      })
      .finally(() => {
        if (!cancelled) setAutoChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [autoChecked])

  const calculateShipping = useCallback((zip?: string) => {
    const checkZip = zip || zipCode

    if (!checkZip || checkZip.length < 5) {
      setError('Enter valid ZIP')
      return
    }

    setIsCalculating(true)
    setError(null)

    // Store ZIP for future use
    localStorage.setItem('userZipCode', checkZip)
    document.cookie = `zipCode=${encodeURIComponent(checkZip)}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days

    // Simulate calculation delay
    setTimeout(() => {
      const zipNum = checkZip.substring(0, 5)

      // Check if it's a US ZIP code (basic validation)
      const zipInt = parseInt(zipNum)
      const isUSZip = zipInt >= 1001 && zipInt <= 99950

      if (!isUSZip) {
        setShippingStatus({
          available: false,
          message: 'Not available to your location'
        })
      } else {
        // LA area ZIP codes (900xx-908xx)
        const isLA = zipNum.startsWith('900') || zipNum.startsWith('901') ||
                     zipNum.startsWith('902') || zipNum.startsWith('903') ||
                     zipNum.startsWith('904') || zipNum.startsWith('905') ||
                     zipNum.startsWith('906') || zipNum.startsWith('907') ||
                     zipNum.startsWith('908')

        if (isLA) {
          setShippingStatus({
            available: true,
            message: 'Local delivery available',
            isLocal: true
          })
        } else {
          setShippingStatus({
            available: true,
            message: 'Ships to your location',
            isLocal: false
          })
        }
      }

      setIsCalculating(false)
    }, 300)
  }, [zipCode])

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 5)
    setZipCode(value)
    setShippingStatus(null)
    setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculateShipping()
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-lg md:text-xl font-medium font-neue-haas text-squarage-black mb-3 md:mb-4">
        Delivery
      </h3>
      <p className="text-base font-neue-haas text-squarage-black mb-2">
        Ships to US/EU
        <span aria-hidden="true" className="mx-3">|</span>
        Local delivery available in Los Angeles
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-base font-neue-haas text-squarage-black">
        <span>Zip code:</span>
        <input
          type="text"
          value={zipCode}
          onChange={handleZipChange}
          onKeyDown={handleKeyPress}
          className="w-16 bg-transparent border-0 border-b-2 border-squarage-black text-center font-neue-haas text-base text-squarage-black focus:outline-none focus:border-squarage-green transition-colors"
          maxLength={5}
          aria-label="ZIP code for delivery"
        />
        <button
          onClick={() => calculateShipping()}
          disabled={isCalculating || zipCode.length < 5}
          className="font-medium font-neue-haas text-base text-squarage-green hover:underline underline-offset-4 disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed transition-colors"
        >
          {isCalculating ? 'Checking...' : 'Check'}
        </button>
        {shippingStatus && !error && (
          <span className="flex items-center gap-1">
            {shippingStatus.available ? (
              <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className={`text-sm font-neue-haas ${
              shippingStatus.available ? 'text-green-700' : 'text-red-700'
            }`}>
              {shippingStatus.message}
              {shippingStatus.isLocal && ' (LA)'}
            </span>
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600 font-neue-haas">{error}</span>
        )}
      </div>
      <ul className="list-disc list-inside text-base font-neue-haas text-gray-600">
        <li>Made to order, ships in 2-4 weeks</li>
      </ul>
    </div>
  )
}
