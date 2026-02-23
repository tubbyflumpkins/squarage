'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'
import MobileCollectionPreloader from '@/components/MobileCollectionPreloader'
import CustomDesignCard from '@/components/ui/CustomDesignCard'

const WOOD_FINISHES = [
  { name: 'Walnut', texture: '/textures/swatches/walnut.webp' },
  { name: 'Oak', texture: '/textures/swatches/oak.webp' },
  { name: 'Birch', texture: '/textures/swatches/birch.webp' },
] as const

export default function WarpedProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFinish, setSelectedFinish] = useState<string>('Oak')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if Shopify is configured
        if (!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || !process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
          console.log('Shopify not configured yet - showing placeholder state')
          setProducts([])
          setLoading(false)
          return
        }
        
        // Fetch products by collection handle 'warped' 
        const warpedProducts = await shopifyApi.getProductsByCollection('warped')
        setProducts(warpedProducts)
      } catch (error) {
        console.error('Error fetching Warped products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <section className="pt-20 lg:pt-32 pb-20 px-6 bg-cream">
      <div>
        {/* Mobile-only preloader - won't affect desktop */}
        <MobileCollectionPreloader products={products} />

        {/* Wood Finish Picker */}
        <div className="flex justify-end mb-8">
          <div className="flex gap-2">
            {WOOD_FINISHES.map(finish => (
              <button
                key={finish.name}
                onClick={() => setSelectedFinish(finish.name)}
                className={`flex items-center gap-2 px-4 py-2 border-2 font-medium font-neue-haas text-sm transition-all ${
                  selectedFinish === finish.name
                    ? 'border-squarage-green bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Image
                  src={finish.texture}
                  alt={finish.name}
                  width={20}
                  height={20}
                  className="w-5 h-5 border border-gray-300"
                />
                <span>{finish.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={products}
          loading={loading}
          emptyMessage="Products coming soon! We&apos;re currently setting up our Shopify integration."
          selectedFinish={selectedFinish}
        >
          <CustomDesignCard finish={selectedFinish as 'Walnut' | 'Oak' | 'Birch'} />
        </ProductGrid>
      </div>
    </section>
  )
}