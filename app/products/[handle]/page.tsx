import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductPage from '@/components/ProductPage'
import WarpedProductPage from '@/components/WarpedProductPage'
import { shopifyApi } from '@/lib/shopify'
import StructuredData, { generateProductSchema, generateBreadcrumbSchema } from '@/components/StructuredData'

interface ProductPageProps {
  params: Promise<{
    handle: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params
  
  try {
    const product = await shopifyApi.getProductByHandle(handle)
    
    if (!product) {
      return {
        title: 'Product Not Found | Squarage Studio',
        description: 'The requested product could not be found.'
      }
    }

    const title = `${product.title} | Squarage Studio`
    const description = product.description || `Handcrafted ${product.title} from Squarage Studio. Made in Los Angeles with premium materials and traditional craftsmanship.`
    const image = product.images?.[0]?.src

    return {
      title,
      description,
      alternates: {
        canonical: `https://squaragestudio.com/products/${handle}`,
      },
      openGraph: {
        title,
        description,
        images: image ? [{ url: image, alt: product.title }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Product Not Found | Squarage Studio',
      description: 'The requested product could not be found.'
    }
  }
}

export default async function ProductPageRoute({ params }: ProductPageProps) {
  const { handle } = await params
  
  try {
    const product = await shopifyApi.getProductByHandle(handle)
    
    if (!product) {
      notFound()
      return // Ensure we don't continue execution
    }

    // Check if product is in the warped collection
    const isWarpedProduct = product.collections?.some((collection: any) => 
      collection.handle === 'warped'
    ) || false

    // Serialize the product data to plain object for client component
  const serializedProduct = {
    id: String(product.id),
    title: String(product.title),
    handle: String(product.handle),
    description: String(product.description || ''),
    descriptionHtml: String(product.descriptionHtml || ''),
    availableForSale: Boolean(product.availableForSale),
    createdAt: String(product.createdAt),
    updatedAt: String(product.updatedAt),
    productType: String(product.productType || ''),
    vendor: String(product.vendor || ''),
    tags: Array.isArray(product.tags) ? product.tags.map(tag => String(tag)) : [],
    options: product.options?.filter((option: any) => option && option.id).map((option: any) => ({
      id: String(option.id),
      name: String(option.name || ''),
      values: option.values?.map((value: any) => 
        typeof value === 'string' ? value : value?.value || String(value || '')
      ) || []
    })) || [],
    variants: product.variants?.filter((variant: any) => variant && variant.id).map((variant: any) => ({
      id: String(variant.id),
      title: String(variant.title || ''),
      availableForSale: Boolean(variant.available), // Use 'available' field instead of 'availableForSale'
      price: {
        amount: String(variant.price?.amount || '0'),
        currencyCode: String(variant.price?.currencyCode || 'USD')
      },
      compareAtPrice: variant.compareAtPrice ? {
        amount: String(variant.compareAtPrice.amount || '0'),
        currencyCode: String(variant.compareAtPrice.currencyCode || 'USD')
      } : null,
      selectedOptions: variant.selectedOptions?.map((option: any) => ({
        name: String(option?.name || ''),
        value: String(option?.value || '')
      })) || [],
      image: variant.image ? {
        id: String(variant.image.id || ''),
        src: String(variant.image.src || ''),
        altText: String(variant.image.altText || '')
      } : null
    })) || [],
    images: product.images?.filter((image: any) => image && image.id && image.src).map((image: any) => ({
      id: String(image.id),
      src: String(image.src),
      altText: String(image.altText || ''),
      width: Number(image.width) || 800,
      height: Number(image.height) || 800
    })) || [],
    metafields: product.metafields?.filter((metafield: any) => metafield && metafield.id).map((metafield: any) => ({
      id: String(metafield.id),
      namespace: String(metafield.namespace || ''),
      key: String(metafield.key || ''),
      value: String(metafield.value || ''),
      type: String(metafield.type || '')
    })) || []
  }

  // Generate structured data for this product
  const productSchema = generateProductSchema({
    name: serializedProduct.title,
    description: serializedProduct.description || `Handcrafted ${serializedProduct.title} from Squarage Studio`,
    image: serializedProduct.images[0]?.src || '/images/logo_main.png',
    price: serializedProduct.variants[0]?.price?.amount || '0',
    currency: 'USD',
    availability: serializedProduct.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    brand: 'Squarage Studio',
    url: `https://squaragestudio.com/products/${handle}`,
    sku: serializedProduct.variants[0]?.id,
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://squaragestudio.com' },
    { name: 'Products', url: 'https://squaragestudio.com/products' },
    { name: serializedProduct.title, url: `https://squaragestudio.com/products/${handle}` },
  ])

  return (
    <>
      <StructuredData data={productSchema} />
      <StructuredData data={breadcrumbSchema} />
      {isWarpedProduct ? (
        <WarpedProductPage product={serializedProduct} />
      ) : (
        <ProductPage product={serializedProduct} />
      )}
    </>
  )
  
  } catch (error) {
    console.error('Error loading product:', error)
    notFound()
    return
  }
}