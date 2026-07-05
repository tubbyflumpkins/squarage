import { shopifyApi, Product } from '@/lib/shopify'
import ProductsPageClient from '@/components/ProductsPageClient'

// Regenerate at most every 10 minutes: keeps the catalog server-rendered
// for crawlers without hitting Shopify on every request
export const revalidate = 600

const COLLECTION_NAMES = ['tiled', 'warped', 'pose']

async function fetchCatalog(): Promise<{
  products: Product[]
  collections: Record<string, Product[]>
}> {
  if (!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || !process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    return { products: [], collections: {} }
  }

  try {
    const [products, ...collectionLists] = await Promise.all([
      shopifyApi.getProducts(),
      ...COLLECTION_NAMES.map((name) =>
        shopifyApi.getProductsByCollection(name).catch(() => [] as Product[])
      ),
    ])

    const collections: Record<string, Product[]> = {}
    COLLECTION_NAMES.forEach((name, index) => {
      collections[name] = collectionLists[index]
    })

    // shopify-buy returns model instances; strip to plain objects so they
    // can cross the server -> client component boundary
    return JSON.parse(JSON.stringify({ products, collections }))
  } catch (error) {
    console.error('Error fetching catalog for /products:', error)
    return { products: [], collections: {} }
  }
}

export default async function ProductsPage() {
  const { products, collections } = await fetchCatalog()

  return (
    <ProductsPageClient
      initialProducts={products}
      initialCollectionProducts={collections}
    />
  )
}
