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
  availableForSale: boolean
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
      const products = await client.product.fetchAll()
      return products
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  },

  // Fetch product by handle
  async getProductByHandle(handle: string): Promise<Product | null> {
    try {
      const products = await client.product.fetchAll()
      const product = products.find((p: any) => p.handle === handle)
      return product || null
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
      
      const collections = await client.collection.fetchAllWithProducts()
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
      
      if (!domain || domain === 'placeholder.myshopify.com' || !token || token === 'placeholder-token') {
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