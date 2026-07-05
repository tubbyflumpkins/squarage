interface StructuredDataProps {
  data: Record<string, any>
}

export default function StructuredData({ data }: StructuredDataProps) {
  // Escape <, >, & as unicode sequences so a string value containing
  // "</script>" (e.g. from Shopify content) can't break out of the tag.
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: json,
      }}
    />
  )
}

// Organization Schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.squarage.com/#organization',
  name: 'Squarage Studio',
  alternateName: 'Squarage',
  url: 'https://www.squarage.com',
  logo: 'https://www.squarage.com/images/logo_main.png',
  description: 'Functional Art & Design - LA-based design studio creating custom furniture and design pieces.',
  email: 'hello@squarage.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Los Angeles',
    addressRegion: 'CA',
    addressCountry: 'US',
  },
  sameAs: [
    'https://www.instagram.com/squaragestudio',
  ],
  founder: {
    '@type': 'Person',
    name: 'Squarage Studio Team',
  },
}

// Local Business Schema
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.squarage.com/#business',
  name: 'Squarage Studio',
  description: 'Custom furniture design studio in Los Angeles creating handcrafted tables, shelves, chairs, and functional art pieces.',
  url: 'https://www.squarage.com',
  email: 'hello@squarage.com',
  image: [
    'https://www.squarage.com/images/hero-main.jpg',
    'https://www.squarage.com/images/collection-tables.jpg',
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Los Angeles',
    addressRegion: 'CA',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 34.0522,
    longitude: -118.2437,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  priceRange: '$$$',
}

// Website Schema
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.squarage.com/#website',
  url: 'https://www.squarage.com',
  name: 'Squarage Studio',
  description: 'Functional Art & Design - LA-based design studio',
  publisher: {
    '@id': 'https://www.squarage.com/#organization',
  },
}

// Product Schema Generator
export function generateProductSchema(product: {
  name: string
  description: string
  image: string
  price: string | number
  currency?: string
  availability?: string
  brand?: string
  sku?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Squarage Studio',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: product.availability || 'https://schema.org/InStock',
      url: product.url,
      seller: {
        '@type': 'Organization',
        name: 'Squarage Studio',
      },
    },
    ...(product.sku && { sku: product.sku }),
  }
}

// Breadcrumb Schema Generator
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}