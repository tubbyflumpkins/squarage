import Client, { Product, Collection, ProductVariant, Image, CheckoutLineItem } from 'shopify-buy'

// Storefront API version — keep the SDK client and the raw GraphQL fetch
// below in sync. Bump within Shopify's ~12-month support window.
export const SHOPIFY_API_VERSION = '2026-01'

// Shopify client configuration
const client = Client.buildClient({
  domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'placeholder.myshopify.com',
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'placeholder-token',
  apiVersion: SHOPIFY_API_VERSION,
})

// Shopify product and collection types
export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  images: ShopifyImage[]
  variants: ShopifyVariant[]
  tags: string[]
  productType: string
  vendor: string
  createdAt: string
  updatedAt: string
  availableForSale: boolean
  options: ShopifyProductOption[]
  metafields?: ShopifyMetafield[]
  priceRange: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
    maxVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
}

export interface ShopifyMetafield {
  id: string
  namespace: string
  key: string
  value: string
  type: string
}

export interface ShopifyImage {
  id: string
  url: string
  altText?: string
  width: number
  height: number
}

export interface ShopifyVariant {
  id: string
  title: string
  price: {
    amount: string
    currencyCode: string
  }
  compareAtPrice?: {
    amount: string
    currencyCode: string
  }
  available: boolean // Shopify Buy SDK uses 'available' not 'availableForSale'
  availableForSale?: boolean // Keep for compatibility, but Buy SDK uses 'available'
  quantityAvailable?: number
  selectedOptions: ShopifySelectedOption[]
  image?: ShopifyImage
  weight?: number
  weightUnit?: string
}

export interface ShopifySelectedOption {
  name: string
  value: string
}

export interface ShopifyProductOption {
  id: string
  name: string
  values: string[]
}

export interface ShopifyCollection {
  id: string
  title: string
  handle: string
  description: string
  image?: ShopifyImage
  products: ShopifyProduct[]
  updatedAt: string
}

// Export native Shopify types for use in components
export type { Product, Collection, ProductVariant, Image, CheckoutLineItem }

// Share one in-flight fetchAllWithProducts across concurrent collection
// lookups (e.g. /products requests tiled+warped+pose in parallel — that was
// three full collection-graph downloads for one page).
let collectionsInflight: Promise<Collection[]> | null = null

function fetchAllCollections(): Promise<Collection[]> {
  if (!collectionsInflight) {
    collectionsInflight = client.collection
      .fetchAllWithProducts({ first: 250, productsFirst: 250 })
      .finally(() => {
        collectionsInflight = null
      }) as Promise<Collection[]>
  }
  return collectionsInflight
}

// True when real (non-placeholder) Shopify credentials are configured.
export function isShopifyConfigured(): boolean {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
  return Boolean(
    domain && domain !== 'placeholder.myshopify.com' && token && token !== 'placeholder-token'
  )
}

// Shopify API functions
export const shopifyApi = {
  // Fetch all products
  async getProducts(): Promise<Product[]> {
    try {
      if (!isShopifyConfigured()) {
        console.log('Shopify credentials not configured')
        return []
      }

      const products = await client.product.fetchAll(250)
      return products
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  },

  // Fetch product by handle with metafields
  async getProductByHandle(handle: string): Promise<Product | null> {
    try {
      // Check if Shopify is configured
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
      
      if (!domain || domain === 'placeholder.myshopify.com' || !token || token === 'placeholder-token') {
        console.log('Shopify credentials not configured')
        return null
      }
      
      // Try GraphQL first for metafields, fall back to SDK if it fails
      try {
        // Custom GraphQL query to fetch product with metafields and collections
        const query = `
          query getProductByHandle($handle: String!) {
            productByHandle(handle: $handle) {
              id
              title
              handle
              description
              descriptionHtml
              availableForSale
              createdAt
              updatedAt
              productType
              vendor
              tags
              metafields(identifiers: [
                { namespace: "custom", key: "size" },
                { namespace: "custom", key: "multisize" },
                { namespace: "custom", key: "multi_size" },
                { namespace: "product", key: "size" },
                { namespace: "product", key: "multisize" },
                { namespace: "product", key: "multi_size" }
              ]) {
                id
                namespace
                key
                value
                type
              }
              collections(first: 10) {
                edges {
                  node {
                    id
                    handle
                    title
                  }
                }
              }
              options {
                id
                name
                values
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      id
                      url
                      altText
                    }
                  }
                }
              }
              images(first: 20) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        `
        
        // Abort a hung Shopify request instead of blocking the SSR render.
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        const response = await fetch(`https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': token,
          },
          body: JSON.stringify({ query, variables: { handle } }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()
        const { data, errors } = responseData
        
        if (errors) {
          console.error('GraphQL errors:', JSON.stringify(errors, null, 2))
          throw new Error('GraphQL query failed')
        }
        
        if (!data?.productByHandle) {
          return null
        }
        
        // Transform GraphQL response to match SDK format
        const product = data.productByHandle
        return {
          ...product,
          variants: product.variants?.edges?.map((edge: any) => ({
            ...edge.node,
            // Normalize GraphQL shape → SDK shape the serializer reads:
            // variant.availableForSale → variant.available, image.url → image.src
            available: edge.node.availableForSale,
            image: edge.node.image
              ? { ...edge.node.image, src: edge.node.image.url }
              : edge.node.image,
          })) || [],
          images: product.images?.edges?.map((edge: any) => ({
            ...edge.node,
            src: edge.node.url, // SDK expects 'src' not 'url'
          })) || [],
          metafields: product.metafields || [], // Metafields are returned directly, not in edges
          collections: product.collections?.edges?.map((edge: any) => edge.node) || [], // Add collections
        }
      } catch (graphqlError) {
        console.warn('GraphQL metafields query failed, falling back to SDK:', graphqlError)
        
        // Fallback to SDK method without metafields
        const products = await client.product.fetchAll(250)
        const product = products.find((p: any) => p.handle === handle)
        
        if (product) {
          // Add empty metafields and collections arrays for compatibility
          return {
            ...product,
            metafields: [],
            collections: [],
          }
        }
        
        return null
      }
    } catch (error) {
      console.error('Error fetching product by handle:', error)
      return null
    }
  },

  // Fetch collection by handle
  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    try {
      if (!isShopifyConfigured()) {
        console.log('Shopify credentials not configured')
        return null
      }

      const collections = await fetchAllCollections()
      const collection = collections.find((c: any) => c.handle === handle)
      return collection || null
    } catch (error) {
      console.error('Error fetching collection by handle:', error)
      return null
    }
  },

  // Fetch all collections
  async getCollections(): Promise<Collection[]> {
    try {
      if (!isShopifyConfigured()) {
        console.log('Shopify credentials not configured')
        return []
      }

      const collections = await fetchAllCollections()
      return collections
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  },

  // Filter products by collection
  async getProductsByCollection(collectionHandle: string): Promise<Product[]> {
    try {
      if (!isShopifyConfigured()) {
        console.log('Shopify credentials not configured')
        return []
      }

      const collection = await this.getCollectionByHandle(collectionHandle)
      return collection?.products || []
    } catch (error) {
      console.error('Error fetching products by collection:', error)
      return []
    }
  },

  // Create checkout
  async createCheckout() {
    try {
      if (!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || !process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
        console.error('Missing Shopify environment variables:')
        console.error('NEXT_PUBLIC_SHOPIFY_DOMAIN:', process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'NOT SET')
        console.error('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN:', process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'SET' : 'NOT SET')
        throw new Error('Missing Shopify environment variables. Please check your .env.local file.')
      }
      const checkout = await client.checkout.create()
      return checkout
    } catch (error) {
      console.error('Error creating checkout:', error)
      throw error
    }
  },

  // Add line items to checkout
  async addToCheckout(checkoutId: string, lineItemsToAdd: any[]) {
    try {
      const checkout = await client.checkout.addLineItems(checkoutId, lineItemsToAdd)
      return checkout
    } catch (error) {
      console.error('Error adding to checkout:', error)
      throw error
    }
  },

  // Update line items in checkout
  async updateCheckout(checkoutId: string, lineItemsToUpdate: any[]) {
    try {
      const checkout = await client.checkout.updateLineItems(checkoutId, lineItemsToUpdate)
      return checkout
    } catch (error) {
      console.error('Error updating checkout:', error)
      throw error
    }
  },

  // Remove line items from checkout
  async removeFromCheckout(checkoutId: string, lineItemIdsToRemove: string[]) {
    try {
      const checkout = await client.checkout.removeLineItems(checkoutId, lineItemIdsToRemove)
      return checkout
    } catch (error) {
      console.error('Error removing from checkout:', error)
      throw error
    }
  },

  // Fetch existing checkout by ID
  async getCheckout(checkoutId: string) {
    try {
      const checkout = await client.checkout.fetch(checkoutId)
      // Check if checkout is still valid (not completed)
      if (checkout && !checkout.completedAt) {
        return checkout
      }
      return null
    } catch (error) {
      console.error('Error fetching checkout:', error)
      return null
    }
  }
}

export default client