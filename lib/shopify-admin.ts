// Shopify Admin API for product management
// This file handles product creation, updates, and media uploads

interface ShopifyAdminConfig {
  domain: string
  adminToken: string
}

interface ProductData {
  title: string
  description: string
  productType?: string
  vendor?: string
  tags?: string[]
  images?: string[]
  variants?: ProductVariant[]
  collections?: string[]
}

interface ProductVariant {
  price: string
  compareAtPrice?: string
  sku?: string
  inventoryQuantity?: number
  weight?: number
  weightUnit?: string
  title?: string
}

interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  product_type: string
  vendor: string
  tags: string
  variants: any[]
  images: any[]
}

class ShopifyAdmin {
  private config: ShopifyAdminConfig

  constructor() {
    this.config = {
      domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || '',
      adminToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || ''
    }
  }

  private getApiUrl(endpoint: string): string {
    return `https://${this.config.domain}/admin/api/2024-10/${endpoint}.json`
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.config.adminToken
    }
  }

  // Test Admin API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.getApiUrl('shop'), {
        headers: this.getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: `Connected to ${data.shop.name} (${data.shop.domain})`
        }
      } else {
        return {
          success: false,
          message: `API Error: ${response.status} - ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Upload image to Shopify
  async uploadImage(imageUrl: string, altText?: string): Promise<any> {
    try {
      const imageData = {
        image: {
          src: imageUrl,
          alt: altText || ''
        }
      }

      const response = await fetch(this.getApiUrl('products/images'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(imageData)
      })

      if (response.ok) {
        const data = await response.json()
        return data.image
      } else {
        throw new Error(`Image upload failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  // Create a new product
  async createProduct(productData: ProductData): Promise<ShopifyProduct> {
    try {
      // Prepare product payload
      const product = {
        title: productData.title,
        body_html: productData.description,
        product_type: productData.productType || 'Furniture',
        vendor: productData.vendor || 'Squarage Studio',
        tags: productData.tags?.join(', ') || '',
        variants: productData.variants?.map(variant => ({
          price: variant.price,
          compare_at_price: variant.compareAtPrice,
          sku: variant.sku,
          inventory_quantity: variant.inventoryQuantity || 1,
          weight: variant.weight,
          weight_unit: variant.weightUnit || 'lb',
          title: variant.title || 'Default Title'
        })) || [{
          price: '0.00',
          inventory_quantity: 1,
          title: 'Default Title'
        }],
        images: productData.images?.map(imageUrl => ({
          src: imageUrl
        })) || []
      }

      const response = await fetch(this.getApiUrl('products'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ product })
      })

      if (response.ok) {
        const data = await response.json()
        const createdProduct = data.product

        // Add to collections if specified
        if (productData.collections?.length) {
          await this.addProductToCollections(createdProduct.id, productData.collections)
        }

        return createdProduct
      } else {
        const errorData = await response.json()
        throw new Error(`Product creation failed: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  // Add product to collections
  async addProductToCollections(productId: string, collectionHandles: string[]): Promise<void> {
    try {
      // First, get all collections to find IDs by handle
      const collectionsResponse = await fetch(this.getApiUrl('collections'), {
        headers: this.getHeaders()
      })

      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json()
        const collections = collectionsData.collections

        for (const handle of collectionHandles) {
          const collection = collections.find((c: any) => c.handle === handle)
          if (collection) {
            // Add product to collection
            await fetch(this.getApiUrl(`collections/${collection.id}/products`), {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify({
                product_id: productId
              })
            })
          }
        }
      }
    } catch (error) {
      console.error('Error adding product to collections:', error)
    }
  }

  // Get all products
  async getProducts(): Promise<ShopifyProduct[]> {
    try {
      const response = await fetch(this.getApiUrl('products'), {
        headers: this.getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        return data.products
      } else {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  // Update product
  async updateProduct(productId: string, updates: Partial<ProductData>): Promise<ShopifyProduct> {
    try {
      const product: any = {}
      
      if (updates.title) product.title = updates.title
      if (updates.description) product.body_html = updates.description
      if (updates.productType) product.product_type = updates.productType
      if (updates.vendor) product.vendor = updates.vendor
      if (updates.tags) product.tags = updates.tags.join(', ')

      const response = await fetch(this.getApiUrl(`products/${productId}`), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ product })
      })

      if (response.ok) {
        const data = await response.json()
        return data.product
      } else {
        const errorData = await response.json()
        throw new Error(`Product update failed: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  // Delete product
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const response = await fetch(this.getApiUrl(`products/${productId}`), {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return response.ok
    } catch (error) {
      console.error('Error deleting product:', error)
      return false
    }
  }

  // Create collection
  async createCollection(title: string, handle: string, description?: string): Promise<any> {
    try {
      const collection = {
        title,
        handle,
        body_html: description || ''
      }

      const response = await fetch(this.getApiUrl('collections'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ collection })
      })

      if (response.ok) {
        const data = await response.json()
        return data.collection
      } else {
        const errorData = await response.json()
        throw new Error(`Collection creation failed: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      throw error
    }
  }
}

// Export singleton instance
export const shopifyAdmin = new ShopifyAdmin()

// Export types
export type { ProductData, ProductVariant, ShopifyProduct }