'use client'

import { useState, useEffect } from 'react'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'
import MobileCollectionPreloader from '@/components/MobileCollectionPreloader'
import CustomDesignCard from '@/components/ui/CustomDesignCard'
import { preloadImages } from '@/lib/simplePreloader'

const WOOD_FINISHES = [
  { name: 'Walnut', texture: '/textures/swatches/walnut_btn.jpg' },
  { name: 'Oak', texture: '/textures/swatches/oak_btn.jpg' },
  { name: 'Birch', texture: '/textures/swatches/birch_btn.jpg' },
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
  // Delayed to let the 3D renderer finish loading first
  useEffect(() => {
    if (products.length === 0) return

    const timer = setTimeout(() => {
      const allImageSrcs: string[] = []
      products.forEach((product: any) => {
        product.images?.forEach((img: any) => {
          const src = img.src || img.url
          if (src) allImageSrcs.push(src)
        })
      })

      if (allImageSrcs.length > 0) {
        preloadImages(allImageSrcs, 2)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [products])

  return (
    <section className="pt-28 lg:pt-32 pb-20 px-6 bg-cream">
      <div>
        {/* Mobile-only preloader - won't affect desktop */}
        <MobileCollectionPreloader products={products} />

        {/* Wood Finish Picker - pulled into padding with -mt-10, sticky below navbar */}
        <div className="flex justify-center lg:justify-end -mt-[72px] mb-4 lg:-mt-[84px] lg:mb-[44px] lg:pr-[1in]">
          <div className="flex gap-2">
            {WOOD_FINISHES.map(finish => {
              const isSelected = selectedFinish === finish.name
              return (
                <button
                  key={finish.name}
                  onClick={() => setSelectedFinish(finish.name)}
                  className={`relative w-24 md:w-28 py-4 md:py-5 rounded-full border-2 font-medium font-neue-haas text-base md:text-lg transition-all bg-cover bg-center overflow-hidden ${
                    isSelected
                      ? 'border-squarage-green shadow-md scale-105'
                      : 'border-transparent shadow-sm hover:shadow-md hover:scale-105'
                  }`}
                  style={{ backgroundImage: `url(${finish.texture})` }}
                >
                  <span className={`relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-semibold ${
                    isSelected ? 'text-[#a8d5a2]' : 'text-white'
                  }`}>
                    {finish.name}
                  </span>
                </button>
              )
            })}
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
