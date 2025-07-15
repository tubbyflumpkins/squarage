import Client, { Product, Collection, ProductVariant, Image, CheckoutLineItem } from 'shopify-buy'

// Shopify client configuration
const client = Client.buildClient({
  domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'placeholder.myshopify.com',
  storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'placeholder-token',
  apiVersion: '2024-10',
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

// Shopify API functions
export const shopifyApi = {
  // Fetch all products
  async getProducts(): Promise<Product[]> {
    try {
      // Check if Shopify is configured
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
      
      if (!domain || domain === 'placeholder.myshopify.com' || !token || token === 'placeholder-token') {
        console.log('Shopify credentials not configured')
        return []
      }
      
      const products = await client.product.fetchAll()
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
        // Custom GraphQL query to fetch product with metafields
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
                { namespace: "custom", key: "size" }
              ]) {
                id
                namespace
                key
                value
                type
              }
              options {
                id
                name
                values
              }
              variants(first: 20) {
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
        
        const response = await fetch(`https://${domain}/api/2024-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': token,
          },
          body: JSON.stringify({ query, variables: { handle } }),
        })
        
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
          variants: product.variants?.edges?.map((edge: any) => edge.node) || [],
          images: product.images?.edges?.map((edge: any) => ({
            ...edge.node,
            src: edge.node.url, // SDK expects 'src' not 'url'
          })) || [],
          metafields: product.metafields || [], // Metafields are returned directly, not in edges
        }
      } catch (graphqlError) {
        console.warn('GraphQL metafields query failed, falling back to SDK:', graphqlError)
        
        // Fallback to SDK method without metafields
        const products = await client.product.fetchAll()
        const product = products.find((p: any) => p.handle === handle)
        
        if (product) {
          // Add empty metafields array for compatibility
          return {
            ...product,
            metafields: [],
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
      // Check if Shopify is configured
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
      
      if (!domain || domain === 'placeholder.myshopify.com' || !token || token === 'placeholder-token') {
        console.log('Shopify credentials not configured')
        return null
      }
      
      console.log('Fetching all collections from Shopify...')
      const collections = await client.collection.fetchAllWithProducts()
      console.log('All collections:', collections.map((c: any) => ({ handle: c.handle, title: c.title, productCount: c.products?.length || 0 })))
      
      const collection = collections.find((c: any) => c.handle === handle)
      console.log('Looking for handle:', handle, 'Found:', collection ? 'Yes' : 'No')
      return collection || null
    } catch (error) {
      console.error('Error fetching collection by handle:', error)
      return null
    }
  },

  // Fetch all collections
  async getCollections(): Promise<Collection[]> {
    try {
      // Check if Shopify is configured
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
      
      if (!domain || domain === 'placeholder.myshopify.com' || !token || token === 'placeholder-token') {
        console.log('Shopify credentials not configured')
        return []
      }
      
      const collections = await client.collection.fetchAllWithProducts()
      return collections
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  },

  // Filter products by collection
  async getProductsByCollection(collectionHandle: string): Promise<Product[]> {
    try {
      // Check if Shopify is configured
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
      
      console.log('getProductsByCollection - Environment check:', {
        domain: domain ? 'SET' : 'MISSING',
        token: token ? 'SET' : 'MISSING',
        collectionHandle
      })
      
      if (!domain || domain === 'placeholder.myshopify.com' || !token || token === 'placeholder-token') {
        console.log('Shopify credentials not configured')
        return []
      }
      
      console.log('Fetching collection:', collectionHandle)
      const collection = await this.getCollectionByHandle(collectionHandle)
      console.log('Collection found:', collection ? `Yes (${collection.products?.length || 0} products)` : 'No')
      return collection?.products || []
    } catch (error) {
      console.error('Error fetching products by collection:', error)
      return []
    }
  },

  // Create checkout
  async createCheckout() {
    try {
      const checkout = await client.checkout.create()
      return checkout
    } catch (error) {
      console.error('Error creating checkout:', error)
      return null
    }
  },

  // Add line items to checkout
  async addToCheckout(checkoutId: string, lineItemsToAdd: any[]) {
    try {
      const checkout = await client.checkout.addLineItems(checkoutId, lineItemsToAdd)
      return checkout
    } catch (error) {
      console.error('Error adding to checkout:', error)
      return null
    }
  },

  // Update line items in checkout
  async updateCheckout(checkoutId: string, lineItemsToUpdate: any[]) {
    try {
      const checkout = await client.checkout.updateLineItems(checkoutId, lineItemsToUpdate)
      return checkout
    } catch (error) {
      console.error('Error updating checkout:', error)
      return null
    }
  },

  // Remove line items from checkout
  async removeFromCheckout(checkoutId: string, lineItemIdsToRemove: string[]) {
    try {
      const checkout = await client.checkout.removeLineItems(checkoutId, lineItemIdsToRemove)
      return checkout
    } catch (error) {
      console.error('Error removing from checkout:', error)
      return null
    }
  }
}

export default client