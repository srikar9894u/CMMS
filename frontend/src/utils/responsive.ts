/**
 * Responsive Design Utilities
 * Centralized breakpoints and responsive helpers for consistent UI across devices
 */

/**
 * Tailwind CSS Breakpoints
 * - Mobile: < 640px (sm)
 * - Tablet: 640px - 1024px (sm to lg)
 * - Desktop: >= 1024px (lg+)
 */
export const BREAKPOINTS = {
  // Pixel values
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultraWide: 1536,

  // Tailwind class prefixes
  sm: 'sm:',   // 640px
  md: 'md:',   // 768px
  lg: 'lg:',   // 1024px
  xl: 'xl:',   // 1280px
  '2xl': '2xl:', // 1536px
} as const;

/**
 * Device Types
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Get current device type based on window width
 */
export const getDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
};

/**
 * Check if current device is mobile
 */
export const isMobile = (): boolean => {
  return getDeviceType() === 'mobile';
};

/**
 * Check if current device is tablet
 */
export const isTablet = (): boolean => {
  return getDeviceType() === 'tablet';
};

/**
 * Check if current device is desktop
 */
export const isDesktop = (): boolean => {
  return getDeviceType() === 'desktop';
};

/**
 * Touch-friendly button sizes
 */
export const TOUCH_TARGET = {
  // Minimum touch target size (44px recommended by Apple, 48px by Google)
  min: 'min-h-[44px] min-w-[44px]',
  small: 'h-10 min-w-[44px]',
  medium: 'h-12 min-w-[48px]',
  large: 'h-14 min-w-[56px]',
} as const;

/**
 * Responsive padding classes
 */
export const RESPONSIVE_PADDING = {
  page: 'p-3 sm:p-4 md:p-6 lg:p-8',
  card: 'p-3 sm:p-4 md:p-6',
  section: 'py-4 sm:py-6 md:py-8',
  tight: 'p-2 sm:p-3 md:p-4',
} as const;

/**
 * Responsive text sizes
 */
export const RESPONSIVE_TEXT = {
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
} as const;

/**
 * Responsive grid columns
 */
export const RESPONSIVE_GRID = {
  cards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  stats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  twoColumn: 'grid-cols-1 md:grid-cols-2',
  threeColumn: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  form: 'grid-cols-1 sm:grid-cols-2',
} as const;

/**
 * Responsive gap sizes
 */
export const RESPONSIVE_GAP = {
  small: 'gap-2 sm:gap-3 md:gap-4',
  medium: 'gap-3 sm:gap-4 md:gap-6',
  large: 'gap-4 sm:gap-6 md:gap-8',
} as const;

/**
 * Mobile-optimized table display
 */
export const TABLE_RESPONSIVE = {
  hideOnMobile: 'hidden sm:table-cell',
  hideOnTablet: 'hidden md:table-cell',
  hideOnDesktop: 'hidden lg:table-cell',
  mobileOnly: 'sm:hidden',
} as const;

/**
 * Sidebar widths
 */
export const SIDEBAR_WIDTH = {
  mobile: 'w-64',        // 256px - Full sidebar on mobile overlay
  tablet: 'w-56',        // 224px - Slightly narrower on tablets
  desktop: 'w-64',       // 256px - Standard sidebar
  collapsed: 'w-16',     // 64px - Icons only
} as const;

/**
 * Hook to listen for window resize and get device type
 */
export const useDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'desktop';

  const [deviceType, setDeviceType] = React.useState<DeviceType>(getDeviceType());

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

// Import React for the hook
import React from 'react';
