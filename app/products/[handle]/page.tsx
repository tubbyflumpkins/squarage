import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductPage from '@/components/ProductPage'
import { shopifyApi } from '@/lib/shopify'

interface ProductPageProps {
  params: Promise<{
    handle: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await shopifyApi.getProductByHandle(handle)
  
  if (!product) {
    return {
      title: 'Product Not Found | Squarage Studio'
    }
  }

  const title = `${product.title} | Squarage Studio`
  const description = product.description || `Handcrafted ${product.title} from Squarage Studio. Made in Los Angeles with premium materials and traditional craftsmanship.`
  const image = product.images?.[0]?.src

  return {
    title,
    description,
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
}

export default async function ProductPageRoute({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await shopifyApi.getProductByHandle(handle)
  
  if (!product) {
    notFound()
  }

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
    options: product.options?.map((option: any) => ({
      id: String(option.id),
      name: String(option.name),
      values: option.values?.map((value: any) => 
        typeof value === 'string' ? value : value.value || String(value)
      ) || []
    })) || [],
    variants: product.variants?.map((variant: any) => ({
      id: String(variant.id),
      title: String(variant.title),
      availableForSale: Boolean(variant.available), // Use 'available' field instead of 'availableForSale'
      price: {
        amount: String(variant.price?.amount || '0'),
        currencyCode: String(variant.price?.currencyCode || 'USD')
      },
      compareAtPrice: variant.compareAtPrice ? {
        amount: String(variant.compareAtPrice.amount),
        currencyCode: String(variant.compareAtPrice.currencyCode)
      } : null,
      selectedOptions: variant.selectedOptions?.map((option: any) => ({
        name: String(option.name),
        value: String(option.value)
      })) || [],
      image: variant.image ? {
        id: String(variant.image.id),
        src: String(variant.image.src),
        altText: String(variant.image.altText || '')
      } : null
    })) || [],
    images: product.images?.map((image: any) => ({
      id: String(image.id),
      src: String(image.src),
      altText: String(image.altText || ''),
      width: Number(image.width) || 800,
      height: Number(image.height) || 800
    })) || [],
    metafields: product.metafields?.map((metafield: any) => ({
      id: String(metafield.id),
      namespace: String(metafield.namespace),
      key: String(metafield.key),
      value: String(metafield.value),
      type: String(metafield.type)
    })) || []
  }

  return <ProductPage product={serializedProduct} />
}