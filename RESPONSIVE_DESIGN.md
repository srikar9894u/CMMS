# CMMS Responsive Design Guide

## Overview
This document outlines the responsive design system for the CMMS application, ensuring optimal user experience across all devices.

## Device Breakpoints

### Standard Breakpoints (Tailwind CSS)
```
Mobile:      < 640px   (default, no prefix)
Small:       >= 640px  (sm:)
Medium:      >= 768px  (md:)
Large:       >= 1024px (lg:)
Extra Large: >= 1280px (xl:)
2X Large:    >= 1536px (2xl:)
```

### Device Categories
- **Mobile**: < 640px (Phones in portrait)
- **Tablet**: 640px - 1024px (Tablets and phones in landscape)
- **Desktop**: >= 1024px (Laptops and desktops)

## Responsive Utilities

Import from `src/utils/responsive.ts`:

```typescript
import {
  BREAKPOINTS,
  TOUCH_TARGET,
  RESPONSIVE_PADDING,
  RESPONSIVE_TEXT,
  RESPONSIVE_GRID,
  RESPONSIVE_GAP,
  useDeviceType,
} from '../utils/responsive';
```

## Design Principles

### 1. Mobile-First Approach
- Design for mobile screens first
- Progressively enhance for larger screens
- Use `sm:`, `md:`, `lg:` prefixes to add desktop features

```tsx
// Mobile first example
<div className="p-4 sm:p-6 lg:p-8">
  {/* 16px padding on mobile, 24px on tablet, 32px on desktop */}
</div>
```

### 2. Touch-Friendly Targets
All interactive elements must meet minimum touch target sizes:
- **Minimum**: 44px x 44px (Apple guideline)
- **Recommended**: 48px x 48px (Material Design)

```tsx
// Use TOUCH_TARGET constants
<button className={`${TOUCH_TARGET.medium} px-4 rounded-lg`}>
  Click Me
</button>
```

### 3. Responsive Typography

```tsx
// Heading sizes scale automatically
<h1 className={RESPONSIVE_TEXT.h1}>Page Title</h1>
<h2 className={RESPONSIVE_TEXT.h2}>Section Title</h2>
<p className={RESPONSIVE_TEXT.body}>Body text</p>
```

### 4. Responsive Grids

```tsx
// Dashboard stats cards
<div className={`grid ${RESPONSIVE_GRID.stats} ${RESPONSIVE_GAP.medium}`}>
  {/* Grid: 1 col mobile, 2 cols tablet, 4 cols desktop */}
</div>
```

### 5. Navigation

#### Mobile Navigation Pattern
```tsx
// Hamburger menu for mobile
// Overlay sidebar that slides in from left
// Closes when clicking outside (overlay)
// Auto-closes when navigating

<button className="md:hidden" onClick={toggleSidebar}>
  {/* Hamburger icon */}
</button>
```

#### Tablet/Desktop Navigation
```tsx
// Persistent sidebar on left
// Fixed width (256px)
// Always visible
```

## Component Guidelines

### Tables

#### Desktop View
- Full table with all columns visible
- Horizontal scroll if too wide
- Sticky header on scroll

#### Tablet View
- Hide less important columns using `hidden md:table-cell`
- Show 4-6 most important columns

#### Mobile View
- Switch to card layout
- Each row becomes a card
- Show only essential information
- Stack label/value pairs

**Example**:
```tsx
import ResponsiveTable from '../components/ResponsiveTable';

<ResponsiveTable
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'category', label: 'Category', hideOnMobile: true },
    { key: 'location', label: 'Location', hideOnMobile: true, hideOnTablet: true },
  ]}
  data={assets}
  keyField="id"
/>
```

### Forms

#### Layout
- Single column on mobile
- Two columns on tablet/desktop
- Full-width inputs on mobile for easier typing

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <input className="w-full px-3 py-2" />
  <input className="w-full px-3 py-2" />
</div>
```

#### Input Sizes
```tsx
// Larger inputs on mobile for easier touch
<input className="h-12 sm:h-10 px-4 text-base" />
```

### Cards

```tsx
<div className={`${RESPONSIVE_PADDING.card} rounded-lg`}>
  <h3 className={RESPONSIVE_TEXT.h3}>Card Title</h3>
  <p className={RESPONSIVE_TEXT.body}>Card content</p>
</div>
```

### Modals

#### Mobile
- Full screen or near full screen
- Close button clearly visible
- Scroll content if needed

#### Desktop
- Centered with max width
- Click outside to close (overlay)

```tsx
<div className="fixed inset-4 sm:inset-auto sm:max-w-2xl sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2">
  {/* Modal content */}
</div>
```

## Layout Structure

### Header
- Fixed height: 64px
- Sticky at top
- Hamburger menu on mobile
- Logo + actions

### Sidebar
- **Mobile**: Overlay, slides from left, 256px wide
- **Tablet/Desktop**: Fixed, always visible, 256px wide
- Closes on mobile when clicking outside or navigating

### Main Content
- **Mobile**: Full width with padding
- **Desktop**: Flex-1 with fixed sidebar

```tsx
<div className="flex">
  <aside className="fixed md:sticky w-64">Sidebar</aside>
  <main className="flex-1 p-4 sm:p-6 lg:p-8">Content</main>
</div>
```

## Performance Considerations

### Images
- Use responsive images with `srcset`
- Lazy load images below the fold
- Optimize for mobile bandwidth

```tsx
<img
  src={logo}
  srcSet={`${logoSmall} 320w, ${logoMedium} 768w, ${logoLarge} 1280w`}
  sizes="(max-width: 640px) 320px, (max-width: 1024px) 768px, 1280px"
  loading="lazy"
  alt="Logo"
/>
```

### Code Splitting
- Load mobile components only on mobile
- Use dynamic imports for large features

```tsx
const DesktopFeature = lazy(() => import('./DesktopFeature'));

{isDesktop && <Suspense fallback={<Loading />}>
  <DesktopFeature />
</Suspense>}
```

## Testing

### Manual Testing Breakpoints
Test at these specific widths:
- 375px (iPhone SE, small mobile)
- 390px (iPhone 12/13/14)
- 428px (iPhone 14 Pro Max)
- 768px (iPad portrait)
- 1024px (iPad landscape, small laptop)
- 1440px (Standard desktop)
- 1920px (Full HD desktop)

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Select device or enter custom dimensions
4. Test all interactive elements
5. Verify touch targets (44px minimum)

### Real Device Testing
- Test on actual iOS and Android devices
- Verify touch interactions
- Check load times on mobile networks

## Accessibility

### Touch Targets
- Minimum 44px x 44px
- Adequate spacing between targets (8px+)
- Visual feedback on tap

### Font Sizes
- Minimum 16px body text (prevents zoom on iOS)
- Scale text appropriately for mobile

### Focus States
- Visible focus indicators
- Keyboard navigation support
- Skip links for screen readers

## Common Patterns

### Hide/Show Based on Screen Size

```tsx
// Show only on mobile
<div className="md:hidden">Mobile only</div>

// Show only on tablet and up
<div className="hidden md:block">Tablet and desktop</div>

// Show only on desktop
<div className="hidden lg:block">Desktop only</div>
```

### Responsive Spacing

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

### Responsive Text Alignment

```tsx
<h1 className="text-left sm:text-center lg:text-left">
  Aligned left on mobile, center on tablet, left on desktop
</h1>
```

## Checklist for New Features

- [ ] Tested on mobile (< 640px)
- [ ] Tested on tablet (640px - 1024px)
- [ ] Tested on desktop (>= 1024px)
- [ ] Touch targets are 44px+ minimum
- [ ] Text is readable on all screen sizes
- [ ] Images load efficiently
- [ ] Navigation works on all devices
- [ ] Forms are easy to use on mobile
- [ ] Tables adapt to mobile (cards or horizontal scroll)
- [ ] No horizontal scroll on mobile (unless intentional)
- [ ] Interactive elements have visual feedback

## Resources

- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/responsive-design)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
