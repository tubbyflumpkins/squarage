'use client'

import { useState, useEffect } from 'react'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'
import MobileCollectionPreloader from '@/components/MobileCollectionPreloader'

export default function CarroProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

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
        
        // Fetch products by collection handle 'tiled' 
        const tiledProducts = await shopifyApi.getProductsByCollection('tiled')
        setProducts(tiledProducts)
      } catch (error) {
        console.error('Error fetching Tiled products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <section className="pt-2 lg:pt-4 pb-20 px-6 bg-cream">
      <div>
        {/* Mobile-only preloader - won't affect desktop */}
        <MobileCollectionPreloader products={products} />
        
        {/* Section Header */}
        <div className="flex items-center mb-4 lg:mb-8" style={{ minHeight: '80px' }}>
          <h2 className="text-4xl md:text-6xl font-bold font-neue-haas text-squarage-black">
            Our Tiled Collection
          </h2>
        </div>

        {/* Products Grid */}
        <ProductGrid 
          products={products}
          loading={loading}
          emptyMessage="Products coming soon! We&apos;re currently setting up our Shopify integration."
        />
      </div>
    </section>
  )
}