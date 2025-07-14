# Squarage Studio Design Language

A comprehensive guide for maintaining visual consistency across all Squarage Studio web pages and digital experiences.

## Color Palette

### Primary Colors
- **Squarage Green**: `#4A9B4E` - Primary brand color, used for navigation menu button, hover states, and interactive elements
- **Squarage Black**: `#333333` - Primary text color, navigation links, borders
- **Squarage White/Cream**: `#fffaf4` - Primary background color, creates warm, inviting feel

### Secondary/Accent Colors
- **Squarage Orange**: `#F7901E` - Bright accent color for highlights and CTAs
- **Squarage Blue**: `#01BAD5` - Cool accent for variety and visual interest
- **Squarage Red**: `#F04E23` - Warm accent for emphasis and energy
- **Squarage Yellow**: `#F5B74C` - Cheerful accent, used for hover states in collections
- **Squarage Pink**: `#F2BAC9` - Soft pink accent for gentle highlights and variety
- **Squarage Dark Blue**: `#2274A5` - Deep blue accent for contrast and sophistication

### Supporting Colors
- **Orange**: `#ff962d` - Alternative orange shade
- **Orange Light**: `#f7a24d` - Lighter orange variant
- **Brown Dark**: `#333` - Deep brown for strong text
- **Brown Medium**: `#666` - Medium brown for body text
- **Brown Light**: `#999` - Light brown for secondary text

## Typography System

### Primary Font: Neue Haas Grotesk
**Font Family**: `'neue-haas-grotesk', sans-serif`
**Available Weights**: 100 (Thin), 200 (XThin), 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold), 900 (Black)
**Styles**: Regular and Italic for each weight

**Usage Guidelines**:
- **Headings**: Use Bold (700) or Black (900) for primary headings
- **Body Text**: Use Regular (400) or Medium (500) for readability
- **Navigation**: Use Thin (100) for large navigation text
- **Captions**: Use Light (300) for secondary information

### Secondary Font: Soap Regular
**Font Family**: `'Soap Regular', serif`
**Usage**: Exclusively for decorative elements like the "Collections" letter blocks
**Character**: Playful, rounded serif that adds personality to specific design elements

## Layout Principles

### Grid System
- **Desktop**: 2-column layout for collections, content sections
- **Mobile**: Single column, stacked layout
- **Containers**: `max-w-7xl mx-auto` for consistent content width
- **Spacing**: Consistent padding of `p-6` for mobile, `p-16` for desktop sections

### Spacing Scale
- **Small**: `4px` (space-1)
- **Medium**: `16px` (space-4)
- **Large**: `32px` (space-8)  
- **XL**: `64px` (space-16)
- **Section**: `80px` (py-20) for major section separation

## Component Patterns

### Navigation
- **Fixed positioning**: `fixed top-0 left-0 right-0 z-50`
- **Transparent background** with full-screen cream overlay menu
- **Green hamburger menu** with white bars, hover animations
- **Large navigation text**: `text-4xl md:text-6xl font-thin`
- **Hover states**: Green color transition on menu items

### Buttons & Interactive Elements
- **Primary Button**: Border style with `border-squarage-black`, hover to green background
- **Menu Button**: Square green background with white hamburger lines
- **Hover Animations**: `transition-all duration-300` for smooth interactions
- **Tooltips**: White background with black border, positioned relative to cursor

### Cards & Content Blocks
- **Collection Cards**: Full-width on mobile, 2-column on desktop
- **Image Treatment**: `aspect-square` for consistency, `object-cover` for proper cropping
- **Background Colors**: Alternating green and cream for visual rhythm
- **Hover Effects**: Subtle scale transforms and color transitions

## Animation Guidelines

### Timing Functions
- **Standard Transitions**: `duration-300` for most interactive elements
- **Slower Transitions**: `duration-500` for larger state changes
- **Image Animations**: `duration-700` for image scaling effects
- **Bounce Animation**: Custom keyframe for Collections letter blocks

### Animation Principles
- **Easing**: Use `ease-out` for natural feeling animations
- **Performance**: Add `will-change: transform` for elements that will animate
- **Cleanup**: Remove `will-change` after animations complete
- **Staggered Animations**: Use delays for sequential letter animations

## Design Philosophy for New Pages

### Visual Hierarchy
1. **Start with cream background** (`bg-cream`) as the foundation
2. **Use green strategically** for primary actions and key interactive elements
3. **Maintain generous white space** for breathing room and elegance
4. **Large typography** for impactful headings and clear readability

### Content Structure
1. **Hero/Header Section**: Large visual impact with minimal text
2. **Main Content**: Clean grid layouts with consistent spacing
3. **Interactive Elements**: Clear hover states and smooth transitions
4. **Footer/Contact**: Subtle but accessible information

### Mobile-First Approach
- **Design for mobile first**, then enhance for desktop
- **Stack elements vertically** on mobile with adequate spacing
- **Touch-friendly targets** minimum 44px for interactive elements
- **Readable font sizes** minimum 16px for body text

### Accessibility Considerations
- **Color contrast**: Ensure sufficient contrast ratios
- **Focus states**: Visible focus indicators for keyboard navigation
- **Alt text**: Descriptive alt text for all images
- **Semantic HTML**: Proper heading hierarchy and landmark elements

## Image Guidelines

### Aspect Ratios
- **Collection Cards**: Square (`aspect-square`) for consistency
- **Hero Images**: `h-[85vh]` for impactful full-screen feel
- **About Images**: `aspect-[4/5]` for portrait orientation

### Optimization
- **Next.js Image Component**: Always use for automatic optimization
- **Priority Loading**: Use `priority` for above-the-fold images
- **Lazy Loading**: Default for images below the fold
- **Quality**: 85% quality for balance of size and clarity

## Implementation Notes

### CSS Custom Properties
```css
:root {
  --foreground-rgb: 51, 51, 51;
  --background-start-rgb: 255, 250, 244;
  --background-end-rgb: 255, 250, 244;
}
```

### Tailwind Configuration
All colors are configured in `tailwind.config.ts` with proper naming conventions (`squarage-green`, `squarage-black`, etc.)

### Font Loading
- **Self-hosted fonts** with `font-display: swap` for performance
- **Font smoothing**: `-webkit-font-smoothing: antialiased` for crisp rendering

---

## Quick Reference for New Pages

When creating new pages, follow this checklist:

1. **Background**: Start with `bg-cream`
2. **Typography**: Use `font-neue-haas` for all text
3. **Colors**: Primary green (`squarage-green`) for key interactions
4. **Spacing**: Use consistent padding (`p-6` mobile, `p-16` desktop)
5. **Images**: Square aspect ratios for consistency
6. **Animations**: 300ms transitions for interactive elements
7. **Layout**: Mobile-first, then desktop enhancements
8. **Navigation**: Maintain fixed header with green menu button

This design language ensures all new pages feel cohesive with the existing Squarage Studio brand while maintaining the clean, modern aesthetic that defines the studio's digital presence.