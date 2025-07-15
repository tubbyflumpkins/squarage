'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { shopifyApi, Product } from '@/lib/shopify'

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

  const formatPrice = (price: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(price))
  }

  if (loading) {
    return (
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold font-neue-haas text-squarage-black mb-12">
              Our Tiled Collection
            </h2>
            <p className="text-xl font-neue-haas text-brown-medium">Loading products...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-7xl mx-auto">
        
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
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group cursor-pointer"
              >
                <div className="bg-white p-6 transition-all duration-300 hover:shadow-lg">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100 mb-6">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0].src}
                        alt={product.images[0].altText || product.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image Available
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold font-neue-haas text-squarage-black group-hover:text-squarage-green transition-colors duration-300">
                      {product.title}
                    </h3>
                    
                    {/* Product Description */}
                    {product.description && (
                      <p className="text-brown-medium font-neue-haas line-clamp-2">
                        {product.description.length > 100 
                          ? `${product.description.substring(0, 100)}...` 
                          : product.description
                        }
                      </p>
                    )}

                    {/* Price */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="pt-2">
                        <span className="text-lg md:text-xl font-bold font-neue-haas text-squarage-black">
                          {formatPrice(
                            product.variants[0].price.amount,
                            product.variants[0].price.currencyCode
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl font-neue-haas text-brown-medium mb-8">
              Products coming soon! We're currently setting up our Shopify integration.
            </p>
            <p className="text-lg font-neue-haas text-brown-light">
              In the meantime, feel free to <Link href="/contact" className="text-squarage-green hover:text-squarage-black transition-colors">contact us</Link> for custom table inquiries.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}