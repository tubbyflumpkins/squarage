import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import ProductPage from '@/components/ProductPage'
import WarpedProductPage from '@/components/WarpedProductPage'
import MateoProductPage from '@/components/MateoProductPage'
import { shopifyApi } from '@/lib/shopify'
import StructuredData, { generateProductSchema, generateBreadcrumbSchema } from '@/components/StructuredData'
import { SerializedProduct, serializeShopifyProduct } from '@/lib/productTypes'
import { MATEO_UNIFIED_HANDLE, MATEO_PRODUCT_HANDLES, mateoStyleForHandle, mateoUnifiedUrl } from '@/lib/mateoProducts'
import { poseVariantOrder, type PoseVariantId } from '@/lib/posePresets'
import { cache } from 'react'

// This route stays fully dynamic (SSR per request): MateoProductPage reads
// useSearchParams() for the Posé ?style= deep links, which bails out of
// static prerendering. Making it ISR would require a Suspense refactor there.

// Dedupe the Shopify fetch across generateMetadata + the page render within
// a single request (previously two live GraphQL calls per view).
const getProduct = cache((handle: string) => shopifyApi.getProductByHandle(handle))

interface ProductPageProps {
  params: Promise<{
    handle: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params

  // The per-style Mateo handles 308-redirect to the unified page (see the
  // page component) — this metadata is never served for a rendered page.
  if (mateoStyleForHandle(handle)) {
    return { title: 'Posé Collection | Squarage Studio' }
  }

  // The unified Mateo handle is virtual — no Shopify product exists behind
  // it, so never fetch it. Title is pinned to the retired master product's
  // output; description borrows the Posé product's copy (fetch shared with
  // the page render via cache()).
  if (handle === MATEO_UNIFIED_HANDLE) {
    const pose = await getProduct(MATEO_PRODUCT_HANDLES.pose).catch(() => null)
    const title = 'Posé Collection | Squarage Studio'
    const description = pose?.description
      || 'Handcrafted Posé Collection from Squarage Studio. Made in Los Angeles with premium materials and traditional craftsmanship.'
    // Dedicated square share crop (gallery lead photo) instead of the
    // Shopify render; resolved against metadataBase (www).
    const image = '/images/og/mateo-chair.jpg'
    return {
      title,
      description,
      alternates: {
        canonical: `https://www.squarage.com/products/${MATEO_UNIFIED_HANDLE}`,
      },
      openGraph: {
        title,
        description,
        images: [{ url: image, alt: 'Posé Collection' }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  }

  try {
    const product = await getProduct(handle)

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
        canonical: `https://www.squarage.com/products/${handle}`,
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

export default async function ProductPageRoute({ params, searchParams }: ProductPageProps) {
  const { handle } = await params

  // The real per-style Mateo handles permanently redirect into the unified
  // page. Kept outside any try/catch: permanentRedirect works by throwing.
  const aliasStyle = mateoStyleForHandle(handle)
  if (aliasStyle) {
    const sp = await searchParams
    const color = typeof sp.color === 'string' ? sp.color : undefined
    permanentRedirect(mateoUnifiedUrl(aliasStyle, color))
  }

  if (handle === MATEO_UNIFIED_HANDLE) {
    return renderMateoUnifiedPage(await searchParams)
  }

  try {
    const product = await getProduct(handle)

    if (!product) {
      notFound()
      return // Ensure we don't continue execution
    }

    // Check if product is in the warped collection
    const isWarpedProduct = product.collections?.some((collection: any) =>
      collection.handle === 'warped'
    ) || false

    // Serialize the product data to plain object for client component
    const serializedProduct = serializeShopifyProduct(product)

    // Generate structured data for this product
    const productSchema = generateProductSchema({
      name: serializedProduct.title,
      description: serializedProduct.description || `Handcrafted ${serializedProduct.title} from Squarage Studio`,
      image: serializedProduct.images[0]?.src || '/images/logo_main.png',
      price: serializedProduct.variants[0]?.price?.amount || '0',
      currency: 'USD',
      availability: serializedProduct.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      brand: 'Squarage Studio',
      url: `https://www.squarage.com/products/${handle}`,
      sku: serializedProduct.variants[0]?.id,
    })

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://www.squarage.com' },
      { name: 'Products', url: 'https://www.squarage.com/products' },
      { name: serializedProduct.title, url: `https://www.squarage.com/products/${handle}` },
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

// The unified Mateo page: one page, three real Shopify products (one per
// style). A missing/failed product degrades to a disabled style button in
// MateoProductPage; only all-three-missing 404s.
async function renderMateoUnifiedPage(sp: { [key: string]: string | string[] | undefined }) {
  const fetched = await Promise.all(
    poseVariantOrder.map((id) => getProduct(MATEO_PRODUCT_HANDLES[id]).catch(() => null))
  )
  const products = Object.fromEntries(
    poseVariantOrder.map((id, i) => [id, fetched[i] ? serializeShopifyProduct(fetched[i]) : null])
  ) as Record<PoseVariantId, SerializedProduct | null>

  if (poseVariantOrder.every((id) => !products[id])) {
    notFound()
  }

  // JSON-LD mirrors the deep-linked style (default Posé); URLs stay pinned
  // to the unified handle.
  const styleParam = typeof sp.style === 'string' ? sp.style : undefined
  const requestedStyle = styleParam && (poseVariantOrder as readonly string[]).includes(styleParam)
    ? (styleParam as PoseVariantId)
    : 'pose'
  const schemaProduct = (products[requestedStyle]
    ?? products[poseVariantOrder.find((id) => products[id])!])!

  const productSchema = generateProductSchema({
    name: schemaProduct.title,
    description: schemaProduct.description || `Handcrafted ${schemaProduct.title} from Squarage Studio`,
    image: schemaProduct.images[0]?.src || '/images/logo_main.png',
    price: schemaProduct.variants[0]?.price?.amount || '0',
    currency: 'USD',
    availability: schemaProduct.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    brand: 'Squarage Studio',
    url: `https://www.squarage.com/products/${MATEO_UNIFIED_HANDLE}`,
    sku: schemaProduct.variants[0]?.id,
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.squarage.com' },
    { name: 'Products', url: 'https://www.squarage.com/products' },
    { name: schemaProduct.title, url: `https://www.squarage.com/products/${MATEO_UNIFIED_HANDLE}` },
  ])

  return (
    <>
      <StructuredData data={productSchema} />
      <StructuredData data={breadcrumbSchema} />
      <MateoProductPage products={products} />
    </>
  )
}
