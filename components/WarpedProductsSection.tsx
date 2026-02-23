'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'
import MobileCollectionPreloader from '@/components/MobileCollectionPreloader'
import CustomDesignCard from '@/components/ui/CustomDesignCard'
import { preloadImages } from '@/lib/simplePreloader'

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

  // Preload ALL product images (all finishes) into simpleImageCache for instant switching
  useEffect(() => {
    if (products.length === 0) return

    const allImageSrcs: string[] = []
    products.forEach((product: any) => {
      product.images?.forEach((img: any) => {
        const src = img.src || img.url
        if (src) allImageSrcs.push(src)
      })
    })

    if (allImageSrcs.length > 0) {
      preloadImages(allImageSrcs, 4)
    }
  }, [products])

  return (
    <section className="pb-20 px-6 bg-cream">
      <div>
        {/* Mobile-only preloader - won't affect desktop */}
        <MobileCollectionPreloader products={products} />

        {/* Spacer for hero blob overlap */}
        <div className="h-14 lg:h-20" />

        {/* Wood Finish Picker - sticky below navbar */}
        <div className="sticky top-20 z-10 flex justify-end mb-4 lg:mb-6">
          <div className="flex gap-2 bg-cream/90 backdrop-blur-sm py-2 px-3 rounded-sm">
            {WOOD_FINISHES.map(finish => (
              <button
                key={finish.name}
                onClick={() => setSelectedFinish(finish.name)}
                className={`flex items-center gap-2 px-3 py-1.5 border-2 font-medium font-neue-haas text-sm transition-all ${
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
