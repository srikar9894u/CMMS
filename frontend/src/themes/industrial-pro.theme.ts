import { ThemeConfig } from '../types/theme.types';

export const industrialProTheme: ThemeConfig = {
  id: 'industrial-pro',
  name: 'Industrial Pro',
  description: 'Professional industrial design with bold colors and clear hierarchy',

  colors: {
    // Backgrounds
    background: 'bg-gray-50 dark:bg-gray-900',
    foreground: 'bg-white dark:bg-gray-800',

    // Primary
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600 dark:text-blue-400',

    // Secondary
    secondary: 'bg-gray-100 dark:bg-gray-700',
    secondaryHover: 'hover:bg-gray-200 dark:hover:bg-gray-600',

    // Text
    textPrimary: 'text-gray-900 dark:text-white',
    textSecondary: 'text-gray-700 dark:text-gray-300',
    textMuted: 'text-gray-500 dark:text-gray-400',

    // Navigation
    navActive: 'bg-blue-100 dark:bg-blue-900/30',
    navActiveText: 'text-blue-700 dark:text-blue-300',
    navHover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    navText: 'text-gray-700 dark:text-gray-300',

    // Status
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',

    // Cards
    cardBg: 'bg-white dark:bg-gray-800',
    cardBorder: 'border-gray-200 dark:border-gray-700',
    border: 'border-gray-200 dark:border-gray-700',

    // Effects
    shadow: 'shadow-md',
    overlay: 'bg-black/50',
  },

  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',

    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },

    slideIn: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 20, opacity: 0 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },

    scaleIn: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
      transition: { duration: 0.2 },
    },

    buttonTap: {
      whileTap: { scale: 0.98 },
      whileHover: { scale: 1.02 },
      transition: { duration: 0.15 },
    },

    cardHover: {
      whileHover: { y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
      transition: { duration: 0.2 },
    },

    modalEnter: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },

  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headingFont: 'inherit',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
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
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    containerMaxWidth: '1280px',
    sidebarWidth: '16rem',
  },

  customCSS: `
    /* Industrial Pro Custom Styles */
    .btn-primary {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-primary:hover {
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
      transform: translateY(-1px);
    }

    .stat-card {
      border-left: 4px solid;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateX(4px);
    }

    .data-table {
      border-collapse: separate;
      border-spacing: 0 0.5rem;
    }

    .data-table tbody tr {
      transition: all 0.2s ease;
    }

    .data-table tbody tr:hover {
      transform: scale(1.01);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  `,
};
