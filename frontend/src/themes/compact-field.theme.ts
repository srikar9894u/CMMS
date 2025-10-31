import { ThemeConfig } from '../types/theme.types';

export const compactFieldTheme: ThemeConfig = {
  id: 'compact-field',
  name: 'Compact Field',
  description: 'Optimized for mobile and field use with large touch targets and high contrast',

  colors: {
    // Backgrounds - high contrast
    background: 'bg-gray-100 dark:bg-gray-950',
    foreground: 'bg-white dark:bg-gray-900',

    // Primary - high visibility orange
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    primaryText: 'text-orange-600 dark:text-orange-400',

    // Secondary
    secondary: 'bg-gray-200 dark:bg-gray-800',
    secondaryHover: 'hover:bg-gray-300 dark:hover:bg-gray-700',

    // Text - high contrast
    textPrimary: 'text-gray-900 dark:text-white',
    textSecondary: 'text-gray-800 dark:text-gray-200',
    textMuted: 'text-gray-600 dark:text-gray-400',

    // Navigation - large touch targets
    navActive: 'bg-orange-100 dark:bg-orange-900/40',
    navActiveText: 'text-orange-800 dark:text-orange-300',
    navHover: 'hover:bg-gray-200 dark:hover:bg-gray-800',
    navText: 'text-gray-800 dark:text-gray-200',

    // Status - bold and clear
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',

    // Cards - minimal shadows
    cardBg: 'bg-white dark:bg-gray-900',
    cardBorder: 'border-gray-300 dark:border-gray-700',
    border: 'border-gray-300 dark:border-gray-700',

    // Effects
    shadow: 'shadow-sm',
    overlay: 'bg-black/70',
  },

  animations: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',

    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },

    slideIn: {
      initial: { x: -10, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 10, opacity: 0 },
      transition: { duration: 0.2 },
    },

    scaleIn: {
      initial: { scale: 0.98, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.98, opacity: 0 },
      transition: { duration: 0.15 },
    },

    buttonTap: {
      whileTap: { scale: 0.96 },
      transition: { duration: 0.1 },
    },

    cardHover: {
      whileHover: { scale: 1.01 },
      transition: { duration: 0.15 },
    },

    modalEnter: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 20, opacity: 0 },
      transition: { duration: 0.2 },
    },
  },

  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headingFont: 'inherit',
    fontSize: {
      xs: '0.875rem',    // Larger minimum for readability
      sm: '1rem',        // Base size increased
      base: '1.125rem',  // Comfortable reading
      lg: '1.25rem',
      xl: '1.5rem',
      '2xl': '1.75rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    spacing: {
      xs: '0.75rem',   // Larger for touch
      sm: '1rem',
      md: '1.25rem',
      lg: '1.75rem',
      xl: '2.5rem',
      '2xl': '3.5rem',
    },
    containerMaxWidth: '1200px',
    sidebarWidth: '14rem',
  },

  customCSS: `
    /* Compact Field Custom Styles - Optimized for Touch */

    /* Larger touch targets */
    button, a, input, select {
      min-height: 44px;
      min-width: 44px;
    }

    /* High contrast buttons */
    .btn-primary {
      background: #ea580c;
      color: white;
      font-weight: 600;
      font-size: 1.125rem;
      padding: 0.875rem 1.5rem;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: #c2410c;
      border-color: #9a3412;
    }

    .btn-primary:active {
      transform: scale(0.98);
    }

    /* Status badges with icons */
    .status-badge {
      font-size: 1rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Cards with clear separation */
    .field-card {
      border: 2px solid;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1rem;
      transition: all 0.2s ease;
    }

    .field-card:active {
      transform: scale(0.99);
      opacity: 0.9;
    }

    /* Large, clear inputs */
    input[type="text"],
    input[type="number"],
    input[type="email"],
    input[type="password"],
    textarea,
    select {
      font-size: 1.125rem;
      padding: 0.875rem 1rem;
      border: 2px solid #d1d5db;
      border-radius: 0.5rem;
      transition: border-color 0.2s ease;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: #ea580c;
      outline: none;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
    }

    /* Mobile-optimized tables */
    @media (max-width: 768px) {
      .responsive-table {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .responsive-table th,
      .responsive-table td {
        min-width: 120px;
        padding: 1rem;
        font-size: 1rem;
      }
    }

    /* Bottom action bar for mobile */
    .mobile-action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 2px solid #e5e7eb;
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
      z-index: 40;
    }

    .dark .mobile-action-bar {
      background: #111827;
      border-top-color: #374151;
    }

    /* Quick access floating button */
    .fab {
      position: fixed;
      bottom: 5rem;
      right: 1.5rem;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #ea580c;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
      transition: all 0.2s ease;
      z-index: 30;
    }

    .fab:active {
      transform: scale(0.95);
    }

    /* Haptic feedback hint */
    @media (hover: none) and (pointer: coarse) {
      button:active,
      .card:active,
      a:active {
        opacity: 0.8;
      }
    }

    /* Offline indicator */
    .offline-banner {
      background: #dc2626;
      color: white;
      padding: 0.75rem;
      text-align: center;
      font-weight: 600;
      font-size: 1rem;
    }

    /* Swipe gesture indicators */
    .swipeable {
      touch-action: pan-y;
      user-select: none;
    }

    /* List items optimized for thumbs */
    .list-item {
      padding: 1.25rem;
      min-height: 72px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: background-color 0.15s ease;
    }

    .dark .list-item {
      border-bottom-color: #374151;
    }

    .list-item:active {
      background-color: #f3f4f6;
    }

    .dark .list-item:active {
      background-color: #1f2937;
    }
  `,
};
