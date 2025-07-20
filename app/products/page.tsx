'use client'

import { useState, useEffect, useMemo } from 'react'
import { shopifyApi, Product } from '@/lib/shopify'
import ProductGrid from '@/components/ProductGrid'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'
type CollectionOption = 'all' | 'tiled' | 'shelves' | 'chairs' | 'objects'

const sortOptions = {
  'featured': { icon: 'featured', label: 'Featured' },
  'price-asc': { icon: 'price-asc', label: 'Price: Low to High' },
  'price-desc': { icon: 'price-desc', label: 'Price: High to Low' },
  'name-asc': { icon: 'A→Z', label: 'Name: A to Z' },
  'name-desc': { icon: 'Z→A', label: 'Name: Z to A' }
}

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [collectionProducts, setCollectionProducts] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [selectedCollection, setSelectedCollection] = useState<CollectionOption>('all')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if Shopify is configured
        if (!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || !process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
          console.log('Shopify not configured yet - showing placeholder state')
          setAllProducts([])
          setLoading(false)
          return
        }
        
        // Fetch all products
        const products = await shopifyApi.getProducts()
        setAllProducts(products)
        
        // Fetch products by collection
        const collections: Record<string, Product[]> = {}
        const collectionNames = ['tiled', 'shelves', 'chairs', 'objects']
        
        for (const collectionName of collectionNames) {
          try {
            const collectionProducts = await shopifyApi.getProductsByCollection(collectionName)
            collections[collectionName] = collectionProducts
            console.log(`Products in ${collectionName} collection:`, collectionProducts.length)
          } catch (error) {
            console.error(`Error fetching ${collectionName} collection:`, error)
            collections[collectionName] = []
          }
        }
        
        setCollectionProducts(collections)
      } catch (error) {
        console.error('Error fetching products:', error)
        setAllProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter and sort products based on user selections
  const filteredAndSortedProducts = useMemo(() => {
    // Start with the appropriate product set
    let filtered = selectedCollection === 'all' 
      ? [...allProducts]
      : [...(collectionProducts[selectedCollection] || [])]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.productType?.toLowerCase().includes(query) ||
        product.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Sort products
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.variants?.[0]?.price?.amount || '0'))
          const priceB = parseFloat(String(b.variants?.[0]?.price?.amount || '0'))
          return priceA - priceB
        })
        break
      case 'price-desc':
        filtered.sort((a, b) => {
          const priceA = parseFloat(String(a.variants?.[0]?.price?.amount || '0'))
          const priceB = parseFloat(String(b.variants?.[0]?.price?.amount || '0'))
          return priceB - priceA
        })
        break
      case 'name-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'name-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'featured':
      default:
        // Keep original order (featured/default)
        break
    }

    return filtered
  }, [allProducts, collectionProducts, searchQuery, sortBy, selectedCollection])

  return (
    <main className="min-h-screen bg-cream pt-24 md:pt-32 pb-20">
      <div className="px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold font-neue-haas text-squarage-black mb-8">
            All Products
          </h1>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-4 md:gap-6 mb-8">
            {/* Search Bar */}
            <div className="w-full relative">
              <svg 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-squarage-black"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-transparent border-b border-black font-neue-haas font-medium text-lg placeholder-gray-500 focus:outline-none focus:border-squarage-green transition-colors"
              />
            </div>
            
            {/* Collection and Sort - Same line on mobile */}
            <div className="flex gap-4 md:gap-6">
              {/* Collection Dropdown */}
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value as CollectionOption)}
                className="flex-1 md:flex-none px-2 py-2 bg-transparent border-b border-black font-neue-haas font-medium text-lg focus:outline-none focus:border-squarage-green transition-colors cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0 center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.2em 1.2em',
                  paddingRight: '2rem'
                }}
              >
                <option value="all">All Collections</option>
                <option value="tiled">Tiled</option>
                <option value="shelves">Shelves</option>
                <option value="chairs">Chairs</option>
                <option value="objects">Objects</option>
              </select>
              
              {/* Sort Dropdown */}
              <div className="relative inline-block">
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-2 bg-transparent border-b border-black font-neue-haas font-medium text-lg focus:outline-none focus:border-squarage-green transition-colors cursor-pointer"
              >
                <span>Sort by</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4"/>
                </svg>
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ width: 'auto', minWidth: '200px' }}
              >
                {Object.entries(sortOptions).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            </div>
          </div>
          
          {/* Results Count */}
          {(searchQuery || selectedCollection !== 'all') && (
            <p className="text-lg font-neue-haas text-squarage-black mb-4">
              Showing {filteredAndSortedProducts.length} of {
                selectedCollection === 'all' 
                  ? allProducts.length 
                  : (collectionProducts[selectedCollection]?.length || 0)
              } products
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCollection !== 'all' && ` in ${selectedCollection} collection`}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <ProductGrid 
          products={filteredAndSortedProducts}
          loading={loading}
          emptyMessage={
            searchQuery || selectedCollection !== 'all'
              ? "No products found. Try adjusting your search or filters."
              : "Products coming soon! We're currently setting up our catalog."
          }
        />
      </div>
    </main>
  )
}