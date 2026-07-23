// The plain-object product shape produced by serializeShopifyProduct below
// and consumed by the product page templates.
export interface SerializedProduct {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  createdAt: string
  updatedAt: string
  productType: string
  vendor: string
  tags: string[]
  options: Array<{
    id: string
    name: string
    values: string[]
  }>
  variants: Array<{
    id: string
    title: string
    availableForSale: boolean
    price: {
      amount: string
      currencyCode: string
    }
    compareAtPrice: {
      amount: string
      currencyCode: string
    } | null
    selectedOptions: Array<{
      name: string
      value: string
    }>
    image: {
      id: string
      src: string
      altText: string
    } | null
  }>
  images: Array<{
    id: string
    src: string
    altText: string
    width: number
    height: number
  }>
  metafields?: Array<{
    id: string
    namespace: string
    key: string
    value: string
    type: string
  }>
  collections?: Array<{
    handle: string
    title: string
  }>
}

// Serialize a Buy-SDK product into a plain object safe to pass to client
// components. Note `collections` is intentionally NOT emitted.
export function serializeShopifyProduct(product: any): SerializedProduct {
  return {
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
    tags: Array.isArray(product.tags) ? product.tags.map((tag: any) => String(tag)) : [],
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
      altText: image.altText ? String(image.altText) : '',
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
}
