import { MetadataRoute } from 'next'
import { shopifyApi } from '@/lib/shopify'
import { MATEO_PRODUCT_HANDLES, MATEO_UNIFIED_HANDLE } from '@/lib/mateoProducts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.squarage.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/custom`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/collections/tiled`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/collections/warped`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/collections/pose`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/customer-service`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      // Virtual handle for the unified Mateo page — not in getProducts()
      // (the three real Mateo handles 308-redirect here and are filtered
      // out of the dynamic list below).
      url: `${baseUrl}/products/${MATEO_UNIFIED_HANDLE}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/collections/warped/designer`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = []
  
  try {
    // Only fetch if Shopify is configured
    if (process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN && process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      const products = await shopifyApi.getProducts()

      // The per-style Mateo handles redirect to the unified page (listed in
      // staticPages); excluding the unified handle too guards against a
      // duplicate while the retired master product still exists in Shopify.
      const excludedHandles = new Set<string>([
        ...Object.values(MATEO_PRODUCT_HANDLES),
        MATEO_UNIFIED_HANDLE,
      ])

      productPages = products
        .filter((product) => !excludedHandles.has(String(product.handle)))
        .map((product) => ({
          url: `${baseUrl}/products/${product.handle}`,
          lastModified: new Date(product.updatedAt || new Date()),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
    // Continue with static pages even if product fetch fails
  }

  return [...staticPages, ...productPages]
}