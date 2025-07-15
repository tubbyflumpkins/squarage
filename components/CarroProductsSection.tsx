'use client'

import { useState, useEffect } from 'react'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'

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
    <section className="py-20 px-6 bg-cream">
      <div>
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold font-neue-haas text-squarage-black mb-8">
            Our Tiled Collection
          </h2>
          <p className="text-xl md:text-2xl font-medium font-neue-haas text-brown-medium leading-relaxed max-w-3xl mx-auto">
            Discover our handcrafted tables, each piece designed to bring beauty and functionality to your space.
          </p>
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