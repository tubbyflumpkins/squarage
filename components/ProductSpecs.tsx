'use client'

import { 
  CubeIcon, 
  SparklesIcon, 
  WrenchScrewdriverIcon, 
  ShieldCheckIcon,
  SwatchIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

interface ProductSpecsProps {
  productType: 'tiled' | 'warped'
  dimensions?: string
  weight?: string
  materials?: string
  finish?: string
  maxLoad?: string
  metafields?: Array<{
    namespace: string
    key: string
    value: string
  }>
}

export default function ProductSpecs({ 
  productType, 
  dimensions,
  weight,
  materials,
  finish,
  maxLoad,
  metafields 
}: ProductSpecsProps) {
  
  // Get metafield value helper
  const getMetafieldValue = (namespace: string, key: string): string => {
    const metafield = metafields?.find(
      field => field.namespace === namespace && field.key === key
    )
    return metafield?.value || ''
  }

  // Get dimensions from metafields or props
  const productDimensions = dimensions || getMetafieldValue('custom', 'size') || 'Custom sizing available'
  const productWeight = weight || getMetafieldValue('custom', 'weight') || (productType === 'tiled' ? '45-65 lbs' : '35-55 lbs')
  const productMaterials = materials || (
    productType === 'tiled' 
      ? 'Marine-grade plywood, ceramic mosaic tiles, premium grout' 
      : 'Solid hardwood (Birch/Oak/Walnut), low-VOC finish'
  )
  const productFinish = finish || (
    productType === 'tiled'
      ? 'Sealed grout, water-resistant surface'
      : 'Hand-sanded, natural oil finish'
  )
  const productMaxLoad = maxLoad || (productType === 'tiled' ? '200 lbs' : '125 lbs')

  const specs = [
    {
      icon: CubeIcon,
      label: 'Dimensions',
      value: productDimensions
    },
    {
      icon: ScaleIcon,
      label: 'Weight',
      value: productWeight
    },
    {
      icon: SwatchIcon,
      label: 'Materials',
      value: productMaterials
    },
    {
      icon: SparklesIcon,
      label: 'Finish',
      value: productFinish
    },
    {
      icon: WrenchScrewdriverIcon,
      label: 'Assembly',
      value: productType === 'tiled' 
        ? 'Ships fully assembled or flat-pack (10 min assembly)'
        : 'Minimal assembly required (15 min)'
    },
    {
      icon: ShieldCheckIcon,
      label: 'Warranty',
      value: '30-day returns • 2-year craftsmanship warranty'
    }
  ]

  const careInstructions = productType === 'tiled'
    ? 'Clean with damp cloth and mild, non-abrasive cleaners. Tiles are sealed and water-resistant.'
    : 'Dust with soft, dry cloth. Use wood-safe cleaner for deeper cleaning. Apply furniture wax annually.'

  return (
    <div className="w-full">
      <h2 className="text-2xl lg:text-3xl font-bold font-neue-haas text-squarage-black mb-6">
        Specifications
      </h2>
      
      {/* Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {specs.map((spec, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-cream border border-gray-200">
            <spec.icon className="w-5 h-5 text-squarage-green mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium font-neue-haas text-gray-600 mb-1">
                {spec.label}
              </p>
              <p className="text-base font-neue-haas text-squarage-black">
                {spec.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Care Instructions */}
      <div className="p-4 bg-cream border border-squarage-black">
        <h3 className="text-lg font-medium font-neue-haas text-squarage-black mb-2">
          Care Instructions
        </h3>
        <p className="text-base font-neue-haas text-squarage-black">
          {careInstructions}
        </p>
      </div>

      {/* Max Load Capacity */}
      <div className="mt-4 p-4 bg-green-50 border border-squarage-green">
        <p className="text-sm font-neue-haas text-squarage-black">
          <span className="font-medium">Maximum Load Capacity:</span> {productMaxLoad}
        </p>
      </div>
    </div>
  )
}