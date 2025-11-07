import { ThemeConfig } from '../types/theme.types';

export const neumorphicSoftTheme: ThemeConfig = {
  id: 'neumorphic-soft',
  name: 'Neumorphic Soft',
  description: 'Soft neumorphic design with subtle shadows and light tones',

  colors: {
    // Backgrounds
    background: 'bg-gray-100 dark:bg-gray-800',
    foreground: 'bg-gray-100 dark:bg-gray-800',

    // Primary
    primary: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-600',
    primaryText: 'text-purple-600 dark:text-purple-400',

    // Secondary
    secondary: 'bg-gray-200 dark:bg-gray-700',
    secondaryHover: 'hover:bg-gray-300 dark:hover:bg-gray-600',

    // Text
    textPrimary: 'text-gray-800 dark:text-gray-100',
    textSecondary: 'text-gray-600 dark:text-gray-300',
    textMuted: 'text-gray-500 dark:text-gray-400',

    // Navigation
    navActive: 'bg-white dark:bg-gray-700',
    navActiveText: 'text-purple-600 dark:text-purple-400',
    navHover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
    navText: 'text-gray-700 dark:text-gray-300',

    // Status
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',

    // Cards
    cardBg: 'bg-gray-100 dark:bg-gray-800',
    cardBorder: 'border-transparent',
    border: 'border-gray-300 dark:border-gray-600',

    // Effects
    shadow: 'shadow-neumorphic',
    overlay: 'bg-black/30',
  },

  animations: {
    fast: '200ms',
    normal: '350ms',
    slow: '600ms',

    easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
    easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',

    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.35 },
    },

    slideIn: {
      initial: { y: 10, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -10, opacity: 0 },
      transition: { duration: 0.35, ease: 'easeOut' },
    },

    scaleIn: {
      initial: { scale: 0.96, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.96, opacity: 0 },
      transition: { duration: 0.25 },
    },

    buttonTap: {
      whileTap: { scale: 0.96 },
      whileHover: { scale: 1.01 },
      transition: { duration: 0.2 },
    },

    cardHover: {
      whileHover: {
        boxShadow: '12px 12px 24px rgba(0,0,0,0.08), -12px -12px 24px rgba(255,255,255,0.9)'
      },
      transition: { duration: 0.25 },
    },

    modalEnter: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  },

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headingFont: 'Inter, sans-serif',
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
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
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
    /* Neumorphic Soft Custom Styles */
    .shadow-neumorphic {
      box-shadow: 8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9);
    }

    .dark .shadow-neumorphic {
      box-shadow: 8px 8px 16px rgba(0,0,0,0.3), -8px -8px 16px rgba(255,255,255,0.02);
    }

    .btn-primary {
      background: linear-gradient(145deg, #a855f7, #9333ea);
      box-shadow: 8px 8px 16px rgba(168,85,247,0.15), -8px -8px 16px rgba(255,255,255,0.7);
      transition: all 0.35s cubic-bezier(0.65, 0, 0.35, 1);
    }

    .btn-primary:hover {
      box-shadow: 6px 6px 12px rgba(168,85,247,0.2), -6px -6px 12px rgba(255,255,255,0.8);
    }

    .btn-primary:active {
      box-shadow: inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.5);
    }

    .stat-card {
      background: linear-gradient(145deg, #f3f4f6, #e5e7eb);
      box-shadow: 8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9);
      border-radius: 1rem;
      transition: all 0.35s ease;
    }

    .dark .stat-card {
      background: linear-gradient(145deg, #374151, #1f2937);
      box-shadow: 8px 8px 16px rgba(0,0,0,0.3), -8px -8px 16px rgba(255,255,255,0.02);
    }

    .stat-card:hover {
      box-shadow: 12px 12px 24px rgba(0,0,0,0.1), -12px -12px 24px rgba(255,255,255,1);
    }

    .data-table tbody tr {
      background: linear-gradient(145deg, #f9fafb, #f3f4f6);
      box-shadow: 4px 4px 8px rgba(0,0,0,0.05), -4px -4px 8px rgba(255,255,255,0.8);
      transition: all 0.3s ease;
    }

    .data-table tbody tr:hover {
      box-shadow: 6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.9);
    }

    .input-neumorphic {
      background: linear-gradient(145deg, #f3f4f6, #e5e7eb);
      box-shadow: inset 4px 4px 8px rgba(0,0,0,0.05), inset -4px -4px 8px rgba(255,255,255,0.5);
      border: none;
    }

    .input-neumorphic:focus {
      box-shadow: inset 6px 6px 12px rgba(0,0,0,0.08), inset -6px -6px 12px rgba(255,255,255,0.6);
      outline: none;
    }
  `,
};
