# Solutions Page Design Reference

> Quick reference guide for implementing solutions pages
> **Date:** 2025-11-17

---

## Page Routes

- `/solutions` - Solutions listing page
- `/solutions/[slug]` - Solution detail page

---

## Component Hierarchy

### Solutions Listing Page
```
SolutionsPage (Server Component)
├── Header
├── Hero Section
│   ├── Heading
│   └── Description
├── Featured Solutions (Optional)
│   └── SolutionCarousel
├── Filter & Search Bar
│   ├── SearchInput
│   ├── CategoryDropdown
│   ├── SortDropdown
│   └── FilterCheckboxes
├── SolutionGrid
│   └── SolutionCard[]
├── Pagination
└── Footer
```

### Solution Detail Page
```
SolutionDetailPage (Server Component)
├── Header
├── Breadcrumb
├── Main Content Grid (2-column)
│   ├── SolutionImageGallery
│   └── Solution Info Panel
│       ├── Title
│       ├── Rating
│       ├── Price
│       ├── Short Description
│       ├── Deliverables
│       ├── Duration
│       ├── Includes
│       ├── CTAs
│       └── Tags
├── Full Description Section
├── SolutionReviews
├── Related Solutions (Optional)
└── Footer
```

---

## Quick Copy-Paste Classes

### Container
```tsx
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

### Section Spacing
```tsx
className="py-12 md:py-16 lg:py-20"
```

### Page Title
```tsx
className="text-4xl md:text-5xl font-bold text-gray-900"
```

### Section Heading
```tsx
className="text-3xl font-bold text-gray-900 mb-6"
```

### Solution Grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
```

### Detail Page Layout
```tsx
className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
```

### Primary Button
```tsx
className="bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors duration-200 shadow-sm hover:shadow-md"
```

### Outline Button
```tsx
className="border-2 border-primary-600 text-primary-600 px-6 py-3 rounded-md font-semibold hover:bg-primary-50 active:bg-primary-100 transition-colors duration-200"
```

### Card
```tsx
className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
```

### Badge - Sale
```tsx
className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold"
```

### Badge - Success
```tsx
className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold"
```

### Badge - Featured
```tsx
className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold"
```

### Breadcrumb
```tsx
<nav className="mb-8 text-sm">
  <ol className="flex items-center gap-2 text-gray-600">
    <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
    <li>/</li>
    <li><Link href="/solutions" className="hover:text-primary-600">Solutions</Link></li>
    <li>/</li>
    <li className="text-gray-900">{solution.name}</li>
  </ol>
</nav>
```

---

## Pricing Display Logic

```tsx
function getPricingDisplay(solution: Solution): string {
  switch (solution.pricingType) {
    case 'fixed':
      return `$${solution.basePrice?.toFixed(2)}`;

    case 'starting_from':
      return `Starting at $${solution.basePrice?.toFixed(2)}`;

    case 'hourly':
      return `$${solution.hourlyRate?.toFixed(2)}/hour`;

    case 'package':
      return solution.priceDisplayText || 'Package Pricing';

    case 'custom_quote':
      return 'Request a Quote';

    default:
      return 'Contact for Pricing';
  }
}
```

---

## Rating Stars Component

```tsx
// Rating Display (Read-only)
<div className="flex items-center gap-1">
  {[1, 2, 3, 4, 5].map((star) => (
    <svg
      key={star}
      className={`w-5 h-5 ${
        star <= rating ? 'text-yellow-400' : 'text-gray-300'
      }`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
</div>
```

---

## Checkmark Icon (for Deliverables)

```tsx
<svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
```

---

## SEO Metadata Template

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution) {
    return { title: 'Solution Not Found' };
  }

  const settings = await getStoreSettings();
  const businessName = settings.businessName || 'Our Business';

  const description = solution.shortDescription ||
    stripHtml(solution.description).substring(0, 160);

  return {
    title: `${solution.name} | ${businessName}`,
    description,
    keywords: solution.tags.join(', '),
    openGraph: {
      title: solution.name,
      description,
      images: solution.images[0] ? [{
        url: solution.images[0],
        width: 1200,
        height: 630,
        alt: solution.name,
      }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: solution.name,
      description,
      images: solution.images[0] ? [solution.images[0]] : [],
    },
  };
}
```

---

## JSON-LD Structured Data

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Solution',
      name: solution.name,
      description: solution.shortDescription,
      provider: {
        '@type': 'Organization',
        name: businessName,
      },
      offers: {
        '@type': 'Offer',
        price: getEffectivePrice(solution),
        priceCurrency: 'USD',
      },
      aggregateRating: solution.averageRating ? {
        '@type': 'AggregateRating',
        ratingValue: solution.averageRating,
        reviewCount: solution.totalReviews || 0,
      } : undefined,
      image: solution.images,
    }),
  }}
/>
```

---

## Data Fetching Patterns

### Server Component (Solution Detail)
```tsx
export default async function SolutionDetailPage({ params }) {
  const { slug } = await params;

  // Fetch solution
  const solution = await getSolutionBySlug(slug);
  if (!solution || !solution.isActive) {
    notFound();
  }

  // Fetch reviews
  const reviews = await getSolutionReviews(solution.id);

  // Serialize timestamps
  const serializedReviews = reviews.map(review => ({
    ...review,
    createdAt: review.createdAt.toDate(),
    updatedAt: review.updatedAt.toDate(),
  }));

  return (
    // JSX
  );
}
```

### Server Component (Listing Page)
```tsx
export default async function SolutionsPage() {
  const settings = await getStoreSettings();

  // Fetch all active solutions
  const solutions = await getSolutions({ activeOnly: true });

  // Serialize timestamps
  const serializedSolutions = solutions.map(solution => ({
    ...solution,
    createdAt: solution.createdAt.toDate(),
    updatedAt: solution.updatedAt.toDate(),
    saleStart: solution.saleStart?.toDate(),
    saleEnd: solution.saleEnd?.toDate(),
  }));

  return (
    // JSX
  );
}
```

---

## Responsive Image Sizes

```tsx
// Solution Card Image
<Image
  src={image}
  alt={name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Solution Detail Main Image
<Image
  src={image}
  alt={name}
  fill
  className="object-cover"
  priority
  sizes="(max-width: 1024px) 100vw, 50vw"
/>
```

---

## Loading Skeleton

```tsx
// Solution Card Skeleton
<div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
  <div className="aspect-square bg-gray-200" />
  <div className="p-4 space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-10 bg-gray-200 rounded" />
  </div>
</div>
```

---

## Empty State

```tsx
<div className="text-center py-12">
  <svg
    className="w-16 h-16 text-gray-400 mx-auto mb-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
  <p className="text-gray-500 text-lg">No solutions found</p>
</div>
```

---

## Key Imports

```tsx
// Server Components
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSolutionBySlug, getSolutions } from '@/solutions/solution-solution';
import { getSolutionReviews } from '@/solutions/review-solution';
import { getStoreSettings } from '@/solutions/business-info-solution';

// Client Components
import Link from 'next/link';
import Image from 'next/image';
import SolutionCard from '@/components/solutions/SolutionCard';
import SolutionGrid from '@/components/solutions/SolutionGrid';
import SolutionImageGallery from '@/components/solutions/SolutionImageGallery';
import SolutionReviews from '@/components/solutions/SolutionReviews';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

// Types
import { Solution, getEffectivePrice, calculateSalePercent } from '@/types/solution';
```

---

**Quick Tip:** Keep this file open while implementing for easy copy-paste of common patterns!
