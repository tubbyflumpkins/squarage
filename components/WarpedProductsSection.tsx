'use client'

import { useState, useEffect } from 'react'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'
import MobileCollectionPreloader from '@/components/MobileCollectionPreloader'
import CustomDesignCard from '@/components/ui/CustomDesignCard'

export default function WarpedProductsSection() {
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

        {/* Products Grid - no title */}
        <ProductGrid
          products={products}
          loading={loading}
          emptyMessage="Products coming soon! We&apos;re currently setting up our Shopify integration."
        >
          <CustomDesignCard />
        </ProductGrid>
      </div>
    </section>
  )
}