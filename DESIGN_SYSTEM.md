# Design System - Local Market E-Commerce Template

## Overview
This design system ensures consistency across all UI components and pages. It defines colors, typography, spacing, and component styles.

---

## Color Palette

### Primary Colors (Customizable per business)
```css
primary-50:  #f0fdf4   /* Lightest - backgrounds */
primary-100: #dcfce7   /* Light - hover states */
primary-200: #bbf7d0   /* Light accent */
primary-300: #86efac   /* Accent */
primary-400: #4ade80   /* Default hover */
primary-500: #22c55e   /* Default primary */
primary-600: #16a34a   /* Dark primary */
primary-700: #15803d   /* Darker */
primary-800: #166534   /* Even darker */
primary-900: #14532d   /* Darkest - text */
```

### Neutral Colors
```css
gray-50:  #f9fafb   /* Backgrounds */
gray-100: #f3f4f6   /* Light backgrounds */
gray-200: #e5e7eb   /* Borders */
gray-300: #d1d5db   /* Disabled */
gray-400: #9ca3af   /* Placeholder */
gray-500: #6b7280   /* Secondary text */
gray-600: #4b5563   /* Body text */
gray-700: #374151   /* Headings */
gray-800: #1f2937   /* Dark headings */
gray-900: #111827   /* Darkest text */
```

### Semantic Colors
```css
success: #10b981   /* Green - success messages, in stock */
warning: #f59e0b   /* Orange - warnings, low stock */
error:   #ef4444   /* Red - errors, out of stock */
info:    #3b82f6   /* Blue - informational */
```

### Additional Colors
```css
sale:     #dc2626   /* Red - sale badges */
featured: #f59e0b   /* Gold - featured badges */
organic:  #22c55e   /* Green - organic badges */
local:    #8b5cf6   /* Purple - local badges */
```

---

## Typography

### Font Families
```css
font-sans: 'Inter', system-ui, -apple-system, sans-serif  /* Body text */
font-display: 'Inter', sans-serif                          /* Headings */
font-mono: 'Menlo', monospace                              /* Code/SKU */
```

### Font Sizes
```css
text-xs:   0.75rem    /* 12px - tiny labels */
text-sm:   0.875rem   /* 14px - small text, captions */
text-base: 1rem       /* 16px - body text */
text-lg:   1.125rem   /* 18px - large body */
text-xl:   1.25rem    /* 20px - small headings */
text-2xl:  1.5rem     /* 24px - card titles */
text-3xl:  1.875rem   /* 30px - section headings */
text-4xl:  2.25rem    /* 36px - page headings */
text-5xl:  3rem       /* 48px - hero headings */
text-6xl:  3.75rem    /* 60px - large hero */
```

### Font Weights
```css
font-normal:    400  /* Body text */
font-medium:    500  /* Emphasis */
font-semibold:  600  /* Subheadings, buttons */
font-bold:      700  /* Headings */
font-extrabold: 800  /* Hero text */
```

### Line Heights
```css
leading-tight:  1.25   /* Headings */
leading-snug:   1.375  /* Compact text */
leading-normal: 1.5    /* Body text */
leading-relaxed: 1.625 /* Spacious text */
leading-loose:  2      /* Very spacious */
```

---

## Spacing Scale

```css
0:    0px       /* No spacing */
0.5:  0.125rem  /* 2px */
1:    0.25rem   /* 4px */
2:    0.5rem    /* 8px */
3:    0.75rem   /* 12px */
4:    1rem      /* 16px */
5:    1.25rem   /* 20px */
6:    1.5rem    /* 24px */
8:    2rem      /* 32px */
10:   2.5rem    /* 40px */
12:   3rem      /* 48px */
16:   4rem      /* 64px */
20:   5rem      /* 80px */
24:   6rem      /* 96px */
```

### Common Spacing Usage
- **Component padding:** `p-4` or `p-6`
- **Section padding:** `py-12` or `py-16`
- **Gap between items:** `gap-4` or `gap-6`
- **Margin between sections:** `mb-8` or `mb-12`

---

## Border Radius

```css
rounded-none: 0px
rounded-sm:   0.125rem  /* 2px - subtle */
rounded:      0.25rem   /* 4px - default */
rounded-md:   0.375rem  /* 6px - inputs, cards */
rounded-lg:   0.5rem    /* 8px - larger cards */
rounded-xl:   0.75rem   /* 12px - modals */
rounded-2xl:  1rem      /* 16px - hero sections */
rounded-full: 9999px    /* Circular - badges, avatars */
```

### Common Usage
- **Buttons:** `rounded-md` or `rounded-lg`
- **Inputs:** `rounded-md`
- **Cards:** `rounded-lg` or `rounded-xl`
- **Badges:** `rounded-full`
- **Images:** `rounded-md` or `rounded-lg`

---

## Shadows

```css
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)           /* Subtle */
shadow:      0 1px 3px rgba(0, 0, 0, 0.1)            /* Default */
shadow-md:   0 4px 6px rgba(0, 0, 0, 0.1)            /* Cards */
shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.1)          /* Elevated cards */
shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.1)          /* Modals */
shadow-2xl:  0 25px 50px rgba(0, 0, 0, 0.25)         /* Large modals */
```

### Common Usage
- **Cards:** `shadow-md` or `shadow-lg`
- **Buttons (hover):** `shadow-md`
- **Modals:** `shadow-xl` or `shadow-2xl`
- **Dropdowns:** `shadow-lg`

---

## Component Patterns

### Buttons

#### Primary Button
```tsx
className="bg-primary-600 text-white px-6 py-3 rounded-md font-semibold
           hover:bg-primary-700 active:bg-primary-800
           transition-colors duration-200
           shadow-sm hover:shadow-md"
```

#### Secondary Button
```tsx
className="bg-gray-200 text-gray-900 px-6 py-3 rounded-md font-semibold
           hover:bg-gray-300 active:bg-gray-400
           transition-colors duration-200"
```

#### Outline Button
```tsx
className="border-2 border-primary-600 text-primary-600 px-6 py-3 rounded-md font-semibold
           hover:bg-primary-50 active:bg-primary-100
           transition-colors duration-200"
```

#### Danger Button
```tsx
className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold
           hover:bg-red-700 active:bg-red-800
           transition-colors duration-200"
```

#### Disabled Button
```tsx
className="bg-gray-300 text-gray-500 px-6 py-3 rounded-md font-semibold
           cursor-not-allowed"
disabled
```

### Inputs

#### Text Input
```tsx
className="w-full px-4 py-3 border border-gray-300 rounded-md
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
           placeholder:text-gray-400
           disabled:bg-gray-100 disabled:cursor-not-allowed"
```

#### Input with Error
```tsx
className="w-full px-4 py-3 border-2 border-red-500 rounded-md
           focus:outline-none focus:ring-2 focus:ring-red-500"
```

#### Input Label
```tsx
className="block text-sm font-medium text-gray-700 mb-2"
```

#### Input Error Message
```tsx
className="text-sm text-red-600 mt-1"
```

### Cards

#### Default Card
```tsx
className="bg-white rounded-lg shadow-md p-6
           hover:shadow-lg transition-shadow duration-200"
```

#### Product Card
```tsx
className="bg-white rounded-lg shadow-md overflow-hidden
           hover:shadow-lg transition-shadow duration-200
           border border-gray-200"
```

#### Clickable Card
```tsx
className="bg-white rounded-lg shadow-md p-6
           hover:shadow-lg hover:border-primary-500
           transition-all duration-200 cursor-pointer
           border-2 border-transparent"
```

### Badges

#### Default Badge
```tsx
className="inline-flex items-center px-3 py-1 rounded-full
           text-xs font-semibold"
```

#### Sale Badge
```tsx
className="inline-flex items-center px-3 py-1 rounded-full
           bg-red-100 text-red-800 text-xs font-semibold"
```

#### Featured Badge
```tsx
className="inline-flex items-center px-3 py-1 rounded-full
           bg-yellow-100 text-yellow-800 text-xs font-semibold"
```

#### Organic Badge
```tsx
className="inline-flex items-center px-3 py-1 rounded-full
           bg-green-100 text-green-800 text-xs font-semibold"
```

#### Stock Status
```tsx
// In Stock
className="inline-flex items-center px-3 py-1 rounded-full
           bg-green-100 text-green-800 text-xs font-semibold"

// Low Stock
className="inline-flex items-center px-3 py-1 rounded-full
           bg-orange-100 text-orange-800 text-xs font-semibold"

// Out of Stock
className="inline-flex items-center px-3 py-1 rounded-full
           bg-red-100 text-red-800 text-xs font-semibold"
```

---

## Responsive Breakpoints

```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

### Common Patterns
```tsx
// Mobile-first approach
className="text-sm md:text-base lg:text-lg"           // Text sizes
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"  // Grid layouts
className="px-4 md:px-6 lg:px-8"                      // Horizontal padding
className="py-8 md:py-12 lg:py-16"                    // Vertical padding
className="hidden md:block"                            // Hide on mobile
className="block md:hidden"                            // Show only on mobile
```

---

## Animation & Transitions

### Transition Classes
```css
transition-colors    /* Color changes (buttons, links) */
transition-shadow    /* Shadow changes (cards) */
transition-transform /* Transform changes (scale, rotate) */
transition-all       /* All properties (use sparingly) */
```

### Durations
```css
duration-75   /* 75ms - very fast */
duration-100  /* 100ms - fast */
duration-150  /* 150ms - quick */
duration-200  /* 200ms - default */
duration-300  /* 300ms - medium */
duration-500  /* 500ms - slow */
```

### Common Animations
```tsx
// Hover scale
className="transition-transform duration-200 hover:scale-105"

// Hover shadow
className="transition-shadow duration-200 hover:shadow-lg"

// Button press
className="active:scale-95 transition-transform duration-100"

// Fade in
className="animate-fade-in"  // Custom animation (defined in tailwind.config)
```

---

## Accessibility Guidelines

### Focus States
Always include visible focus states:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
```

### Color Contrast
- **Normal text (< 18px):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px):** Minimum 3:1 contrast ratio
- **Icons and graphics:** Minimum 3:1 contrast ratio

### Touch Targets
- **Minimum size:** 44x44px for all clickable elements
- **Spacing:** At least 8px between touch targets

### ARIA Labels
```tsx
// Buttons with icons only
<button aria-label="Close modal">
  <XIcon />
</button>

// Images
<img src="..." alt="Fresh organic tomatoes" />

// Links
<a href="..." aria-label="View product details">
  Learn more
</a>
```

---

## Layout Patterns

### Container
```tsx
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

### Section Spacing
```tsx
className="py-12 md:py-16 lg:py-20"
```

### Grid Layouts
```tsx
// Product grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

// Two column layout
className="grid grid-cols-1 lg:grid-cols-2 gap-8"

// Sidebar layout
className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8"
```

### Flexbox Patterns
```tsx
// Center content
className="flex items-center justify-center"

// Space between items
className="flex items-center justify-between"

// Stack vertically with gap
className="flex flex-col gap-4"

// Responsive row to column
className="flex flex-col md:flex-row gap-4"
```

---

## Z-Index Scale

```css
z-0:   0     /* Default */
z-10:  10    /* Dropdowns */
z-20:  20    /* Sticky header */
z-30:  30    /* Modals backdrop */
z-40:  40    /* Modals content */
z-50:  50    /* Tooltips, popovers */
```

---

## Notes

- **Customization:** Update `tailwind.config.ts` to match business branding
- **Consistency:** Always refer to this guide when building components
- **Accessibility:** Never sacrifice accessibility for aesthetics
- **Performance:** Use `transition-colors` over `transition-all` when possible
- **Mobile-first:** Always design for mobile first, then scale up
