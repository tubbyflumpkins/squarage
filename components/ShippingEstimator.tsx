'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface ShippingEstimatorProps {
  price: number
  productTitle: string
}

export default function ShippingEstimator({ price, productTitle }: ShippingEstimatorProps) {
  const [zipCode, setZipCode] = useState('')
  const [shippingStatus, setShippingStatus] = useState<{
    available: boolean
    message: string
    isLocal?: boolean
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoChecked, setAutoChecked] = useState(false)

  // Try to get ZIP from various sources on mount
  useEffect(() => {
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
    if (storedZip && !autoChecked) {
      setZipCode(storedZip)
      // Auto-calculate for stored ZIP
      setTimeout(() => {
        calculateShipping(storedZip)
        setAutoChecked(true)
      }, 500)
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
    <div className="w-full space-y-2">
      {/* Title and Input Row */}
      <div className="flex items-center gap-3">
        <TruckIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <input
          type="text"
          value={zipCode}
          onChange={handleZipChange}
          onKeyPress={handleKeyPress}
          placeholder="ZIP code"
          className="w-24 px-2 py-1 border border-gray-300 bg-cream font-neue-haas text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-squarage-orange focus:border-transparent"
          maxLength={5}
          aria-label="ZIP code for shipping"
        />
        <button
          onClick={() => calculateShipping()}
          disabled={isCalculating || zipCode.length < 5}
          className="px-3 py-1 bg-squarage-black text-cream font-neue-haas text-sm font-medium hover:bg-squarage-orange transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isCalculating ? '...' : 'Check'}
        </button>
        
        {/* Inline Status */}
        {shippingStatus && !error && (
          <div className="flex items-center gap-1.5 flex-1">
            {shippingStatus.available ? (
              <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="text-sm font-neue-haas text-squarage-black">
              {shippingStatus.message}
              {!shippingStatus.available && (
                <> • <Link href="/contact" className="text-squarage-orange hover:underline">Contact us</Link></>
              )}
            </span>
          </div>
        )}
        
        {error && (
          <span className="text-sm text-red-600 font-neue-haas">{error}</span>
        )}
      </div>

      {/* Bottom text - compact */}
      <div className="text-xs font-neue-haas text-gray-500">
        Made to order • Ships in 2-3 weeks • Final shipping at checkout
      </div>
    </div>
  )
}