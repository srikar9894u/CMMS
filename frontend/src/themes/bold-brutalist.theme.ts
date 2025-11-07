import { ThemeConfig } from '../types/theme.types';

export const boldBrutalistTheme: ThemeConfig = {
  id: 'bold-brutalist',
  name: 'Bold Brutalist',
  description: 'Bold, high-contrast brutalist design with geometric shapes',

  colors: {
    // Backgrounds
    background: 'bg-white dark:bg-black',
    foreground: 'bg-white dark:bg-gray-950',

    // Primary
    primary: 'bg-black dark:bg-white',
    primaryHover: 'hover:bg-gray-900 dark:hover:bg-gray-100',
    primaryText: 'text-black dark:text-white',

    // Secondary
    secondary: 'bg-gray-200 dark:bg-gray-800',
    secondaryHover: 'hover:bg-gray-300 dark:hover:bg-gray-700',

    // Text
    textPrimary: 'text-black dark:text-white',
    textSecondary: 'text-gray-800 dark:text-gray-200',
    textMuted: 'text-gray-600 dark:text-gray-400',

    // Navigation
    navActive: 'bg-black dark:bg-white',
    navActiveText: 'text-white dark:text-black',
    navHover: 'hover:bg-gray-100 dark:hover:bg-gray-900',
    navText: 'text-black dark:text-white',

    // Status
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
    info: 'bg-blue-600',

    // Cards
    cardBg: 'bg-white dark:bg-gray-950',
    cardBorder: 'border-black dark:border-white',
    border: 'border-black dark:border-white',

    // Effects
    shadow: 'shadow-brutalist',
    overlay: 'bg-black/80',
  },

  animations: {
    fast: '100ms',
    normal: '200ms',
    slow: '400ms',

    easeIn: 'cubic-bezier(0.6, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.4, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',

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
      transition: { duration: 0.2, ease: 'linear' },
    },

    scaleIn: {
      initial: { scale: 1, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1, opacity: 0 },
      transition: { duration: 0.15 },
    },

    buttonTap: {
      whileTap: { scale: 0.95 },
      whileHover: { scale: 1 },
      transition: { duration: 0.1 },
    },

    cardHover: {
      whileHover: {
        x: 4,
        y: -4,
        boxShadow: '8px 8px 0 rgba(0,0,0,1)'
      },
      transition: { duration: 0.15 },
    },

    modalEnter: {
      initial: { scale: 1, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1, opacity: 0 },
      transition: { duration: 0.2 },
    },
  },

  typography: {
    fontFamily: 'Courier New, monospace',
    headingFont: 'Arial Black, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 600,
      semibold: 700,
      bold: 900,
    },
  },

  layout: {
    borderRadius: {
      sm: '0',
      md: '0',
      lg: '0',
      xl: '0',
      full: '0',
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    containerMaxWidth: '1400px',
    sidebarWidth: '18rem',
  },

  customCSS: `
    /* Bold Brutalist Custom Styles */
    * {
      letter-spacing: -0.02em;
    }

    .shadow-brutalist {
      box-shadow: 4px 4px 0 rgba(0,0,0,1);
    }

    .dark .shadow-brutalist {
      box-shadow: 4px 4px 0 rgba(255,255,255,1);
    }

    .btn-primary {
      background: #000;
      color: #fff;
      border: 3px solid #000;
      box-shadow: 4px 4px 0 rgba(0,0,0,1);
      transition: all 0.1s linear;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 0.05em;
    }

    .dark .btn-primary {
      background: #fff;
      color: #000;
      border: 3px solid #fff;
      box-shadow: 4px 4px 0 rgba(255,255,255,1);
    }

    .btn-primary:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 rgba(0,0,0,1);
    }

    .dark .btn-primary:hover {
      box-shadow: 2px 2px 0 rgba(255,255,255,1);
    }

    .btn-primary:active {
      transform: translate(4px, 4px);
      box-shadow: none;
    }

    .stat-card {
      background: #fff;
      border: 4px solid #000;
      box-shadow: 6px 6px 0 rgba(0,0,0,1);
      transition: all 0.15s linear;
    }

    .dark .stat-card {
      background: #000;
      border: 4px solid #fff;
      box-shadow: 6px 6px 0 rgba(255,255,255,1);
    }

    .stat-card:hover {
      transform: translate(2px, 2px);
      box-shadow: 4px 4px 0 rgba(0,0,0,1);
    }

    .dark .stat-card:hover {
      box-shadow: 4px 4px 0 rgba(255,255,255,1);
    }

    .data-table {
      border-collapse: separate;
      border-spacing: 0;
      border: 3px solid #000;
    }

    .dark .data-table {
      border: 3px solid #fff;
    }

    .data-table th {
      background: #000;
      color: #fff;
      border: 2px solid #000;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dark .data-table th {
      background: #fff;
      color: #000;
      border: 2px solid #fff;
    }

    .data-table tbody tr {
      border: 2px solid #000;
      transition: all 0.1s linear;
    }

    .dark .data-table tbody tr {
      border: 2px solid #fff;
    }

    .data-table tbody tr:hover {
      background: #f3f4f6;
      transform: translateX(4px);
    }

    .dark .data-table tbody tr:hover {
      background: #1f2937;
    }

    .input-brutalist {
      border: 3px solid #000;
      background: #fff;
      box-shadow: 3px 3px 0 rgba(0,0,0,1);
    }

    .dark .input-brutalist {
      border: 3px solid #fff;
      background: #000;
      box-shadow: 3px 3px 0 rgba(255,255,255,1);
    }

    .input-brutalist:focus {
      outline: none;
      box-shadow: 5px 5px 0 rgba(0,0,0,1);
    }

    .dark .input-brutalist:focus {
      box-shadow: 5px 5px 0 rgba(255,255,255,1);
    }

    h1, h2, h3, h4, h5, h6 {
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 900;
    }
  `,
};
