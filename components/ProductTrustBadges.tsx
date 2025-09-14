'use client'

import Link from 'next/link'
import { 
  CubeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function ProductTrustBadges() {
  const badges = [
    {
      icon: CubeIcon,
      title: 'Easy Returns',
      description: 'Not satisfied? Return items within 30 days',
      link: '/customer-service?doc=return-policy',
      linkText: 'Return Policy'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Warranty',
      description: '1-year warranty on craftsmanship and materials',
      link: '/customer-service?doc=warranty-policy',
      linkText: 'Warranty Details'
    },
    {
      icon: SparklesIcon,
      title: 'Quality Guarantee',
      description: 'Each piece individually crafted and inspected for perfection'
    }
  ]

  return (
    <div className="w-full py-8 border-t border-b border-gray-200">
      {/* Desktop - Horizontal Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
        {badges.map((badge, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0">
              <badge.icon className="w-8 h-8 text-squarage-green" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold font-neue-haas text-squarage-black mb-1">
                {badge.title}
              </h3>
              <p className="text-sm font-neue-haas text-gray-600">
                {badge.description}
              </p>
              {badge.link && (
                <Link 
                  href={badge.link}
                  className="inline-flex items-center gap-0.5 mt-1 text-xs font-neue-haas text-gray-500 hover:text-squarage-orange transition-colors group"
                >
                  <span>{badge.linkText}</span>
                  <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile - Stacked Layout */}
      <div className="lg:hidden space-y-6">
        {badges.map((badge, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0">
              <badge.icon className="w-8 h-8 text-squarage-green" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold font-neue-haas text-squarage-black mb-1">
                {badge.title}
              </h3>
              <p className="text-sm font-neue-haas text-gray-600">
                {badge.description}
              </p>
              {badge.link && (
                <Link 
                  href={badge.link}
                  className="inline-flex items-center gap-0.5 mt-1 text-xs font-neue-haas text-gray-500 hover:text-squarage-orange transition-colors group"
                >
                  <span>{badge.linkText}</span>
                  <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}