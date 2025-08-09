# Warped Collection Style Guide

## Overview
The Warped collection page showcases handcrafted wooden shelving systems with organic, naturally curved designs. This style guide defines the visual language specifically for the Warped collection while maintaining consistency with the overall Squarage Studio brand.

## Design Philosophy
Unlike the playful, colorful Tiled collection, Warped embraces a more sophisticated, earth-toned aesthetic that reflects the natural beauty of wood and organic forms. The design emphasizes craftsmanship, natural materials, and the unique character of warped wood.

## Color Palette

### Primary Colors
- **Background**: Cream (`#fffaf4`) - Maintains site-wide consistency
- **Dark Brown**: `#60432F` - Primary color for headers, hero blob, text, and borders
- **Light Brown**: `#F3CCA5` - Background color for content sections
- **Squarage Green**: `#4A9B4E` - Accent color for highlights (main brand color)

### Color Usage
- **Hero Blob**: Dark Brown (`#60432F`) background with white text
- **Content Background**: Light Brown (`#F3CCA5`) for warm, inviting sections
- **All Text (except hero)**: Squarage Black (`#333333`) for consistency and readability
- **Image Borders**: Dark Brown (`#60432F`) for framing elements
- **Product Section Header**: Dark Brown (`#60432F`) for emphasis

## Typography
- **Hero Title**: Bold (700) Neue Haas Grotesk with organic shadow effect
- **Section Headers**: Medium (500) Neue Haas Grotesk in dark wood brown
- **Body Text**: Regular (400) Neue Haas Grotesk in charcoal
- **Emphasis**: Use weight variations rather than color for emphasis

## Visual Elements

### Hero Section
- Full-width hero image of shelving products
- Title treatment with organic, curved blob shape in dark wood brown
- Subtle shadow effect using forest green instead of bright colors
- Positioned to complement the natural lines in the hero image

### Content Section
- Background: Warm wood tone (`#D2B48C`) instead of bright yellow
- Featured image with thick border in rust orange or walnut
- Text emphasizing craftsmanship, natural materials, and organic design
- Grid layout maintaining standard responsive structure

### Product Grid
- Cream background for consistency
- Product cards with subtle wood-grain texture overlays (optional)
- Hover effects using forest green instead of bright green
- Emphasis on product photography showing wood grain and natural textures

## Design Principles

### Natural & Organic
- Embrace asymmetry and organic shapes
- Use curved edges and flowing lines
- Avoid sharp geometric patterns

### Sophisticated & Earthy
- Muted, natural color palette
- Emphasis on texture and material quality
- Subtle animations and transitions

### Craftsmanship Focus
- Highlight wood grain and natural imperfections
- Emphasize handmade quality
- Show construction details and joinery

## Component Specifications

### WarpedHeroSection
- Height: 42vh mobile / 70vh desktop
- Background image: `/images/collection-shelves.jpg`
- Title blob: Dark Brown (`#60432F`) with organic border-radius
- Title text: White, no shadow effect
- Blob shape: `borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%'`

### WarpedContentSection
- Background: Light Brown (`#F3CCA5`)
- Padding: pt-20 pb-10 lg:pt-24 lg:pb-12 px-6
- Image border: 40px in Dark Brown (`#60432F`)
- Heading color: Squarage Black (`#333333`)
- Text color: Squarage Black (`#333333`) for better readability

### WarpedProductsSection
- Background: Cream (`#fffaf4`)
- Grid: Responsive 1-4 columns
- Section header: Dark Brown (`#60432F`)
- Product hover: Scale 1.05 with green accent
- Loading state: Wood-grain skeleton animation

## Animation Guidelines
- Slower, more deliberate transitions (400-500ms)
- Organic easing curves (cubic-bezier for natural movement)
- Subtle grain/texture reveals on hover
- No bouncy animations - keep movements smooth and refined

## Responsive Considerations
- Mobile: Stack elements with generous spacing
- Tablet: 2-column layouts for products
- Desktop: Full 3-4 column grids
- Maintain readability with appropriate font sizes

## Content Tone
- Professional yet approachable
- Emphasis on quality and craftsmanship
- Natural and sustainable messaging
- Technical details about wood types and construction

## Implementation Notes
- Use existing Tailwind color classes where possible
- Add custom colors to tailwind.config.ts if needed
- Maintain semantic HTML structure
- Ensure accessibility with proper contrast ratios
- Test on various screen sizes for optimal display

This style guide ensures the Warped collection page feels distinct and appropriate for wood shelving products while maintaining coherence with the overall Squarage Studio brand identity.