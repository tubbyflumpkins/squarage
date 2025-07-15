'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from 'shopify-buy'

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  
  // Format price
  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(price))
  }

  // Get the current price from first variant
  const currentPrice = product.variants?.[0] 
    ? formatPrice(String(product.variants[0].price.amount), product.variants[0].price.currencyCode)
    : 'Price unavailable'


  return (
    <Link 
      href={`/products/${product.handle}`}
      className={`block ${className}`}
    >
      {/* Product Image */}
      <div className="relative bg-gray-50 mb-4">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0].src}
            alt={product.images[0].altText || product.title}
            width={600}
            height={600}
            className="w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 font-neue-haas">No Image</span>
          </div>
        )}
      </div>

      {/* Product Info - Name and Price aligned with image edges */}
      <div className="flex justify-between items-start">
        <h3 className="font-neue-haas font-medium text-lg text-gray-900">
          {product.title}
        </h3>
        <span className="font-neue-haas font-medium text-lg text-gray-900 ml-4">
          {currentPrice}
        </span>
      </div>
    </Link>
  )
}