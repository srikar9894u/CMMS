import { ThemeConfig } from '../types/theme.types';

export const minimalLightTheme: ThemeConfig = {
  id: 'minimal-light',
  name: 'Minimal Light',
  description: 'Clean, minimal design with lots of whitespace and subtle accents',

  colors: {
    // Backgrounds
    background: 'bg-white dark:bg-zinc-950',
    foreground: 'bg-white dark:bg-zinc-900',

    // Primary
    primary: 'bg-zinc-900 dark:bg-zinc-100',
    primaryHover: 'hover:bg-zinc-800 dark:hover:bg-zinc-200',
    primaryText: 'text-zinc-900 dark:text-zinc-100',

    // Secondary
    secondary: 'bg-zinc-50 dark:bg-zinc-900',
    secondaryHover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',

    // Text
    textPrimary: 'text-zinc-900 dark:text-zinc-50',
    textSecondary: 'text-zinc-600 dark:text-zinc-400',
    textMuted: 'text-zinc-400 dark:text-zinc-500',

    // Navigation
    navActive: 'bg-zinc-100 dark:bg-zinc-900',
    navActiveText: 'text-zinc-900 dark:text-zinc-100',
    navHover: 'hover:bg-zinc-50 dark:hover:bg-zinc-900',
    navText: 'text-zinc-700 dark:text-zinc-300',

    // Status
    success: 'bg-green-600',
    warning: 'bg-orange-500',
    danger: 'bg-red-600',
    info: 'bg-blue-600',

    // Cards
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border-zinc-100 dark:border-zinc-800',
    border: 'border-zinc-200 dark:border-zinc-800',

    // Effects
    shadow: 'shadow-sm',
    overlay: 'bg-black/20',
  },

  animations: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',

    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.25 },
    },

    slideIn: {
      initial: { y: 8, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -8, opacity: 0 },
      transition: { duration: 0.25, ease: 'easeOut' },
    },

    scaleIn: {
      initial: { scale: 0.98, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.98, opacity: 0 },
      transition: { duration: 0.2 },
    },

    buttonTap: {
      whileTap: { scale: 0.98 },
      transition: { duration: 0.1 },
    },

    cardHover: {
      whileHover: {
        y: -1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      },
      transition: { duration: 0.2 },
    },

    modalEnter: {
      initial: { scale: 0.98, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.98, opacity: 0 },
      transition: { duration: 0.25, ease: 'easeOut' },
    },
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    headingFont: 'inherit',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '0.9375rem',
      lg: '1.0625rem',
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
      xl: '0.625rem',
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
    containerMaxWidth: '1200px',
    sidebarWidth: '15rem',
  },

  customCSS: `
    /* Minimal Light Custom Styles */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .btn-primary {
      background: #18181b;
      color: #fafafa;
      border: 1px solid #18181b;
      box-shadow: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
    }

    .dark .btn-primary {
      background: #fafafa;
      color: #18181b;
      border: 1px solid #fafafa;
    }

    .btn-primary:hover {
      background: #27272a;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .dark .btn-primary:hover {
      background: #e4e4e7;
    }

    .btn-primary:active {
      transform: translateY(0);
      box-shadow: none;
    }

    .btn-secondary {
      background: #fff;
      color: #18181b;
      border: 1px solid #e4e4e7;
      transition: all 0.25s ease;
    }

    .dark .btn-secondary {
      background: #18181b;
      color: #fafafa;
      border: 1px solid #3f3f46;
    }

    .btn-secondary:hover {
      border-color: #d4d4d8;
      background: #fafafa;
    }

    .dark .btn-secondary:hover {
      border-color: #52525b;
      background: #27272a;
    }

    .stat-card {
      background: #fff;
      border: 1px solid #f4f4f5;
      transition: all 0.25s ease;
      padding: 2rem;
    }

    .dark .stat-card {
      background: #18181b;
      border: 1px solid #27272a;
    }

    .stat-card:hover {
      border-color: #e4e4e7;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .dark .stat-card:hover {
      border-color: #3f3f46;
    }

    .stat-card .stat-label {
      font-size: 0.875rem;
      color: #71717a;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .stat-card .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: #18181b;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .dark .stat-card .stat-value {
      color: #fafafa;
    }

    .data-table {
      border-collapse: collapse;
      width: 100%;
    }

    .data-table thead {
      border-bottom: 1px solid #e4e4e7;
    }

    .dark .data-table thead {
      border-bottom: 1px solid #3f3f46;
    }

    .data-table th {
      font-weight: 500;
      font-size: 0.875rem;
      color: #71717a;
      text-align: left;
      padding: 1rem;
    }

    .data-table tbody tr {
      border-bottom: 1px solid #f4f4f5;
      transition: background 0.15s ease;
    }

    .dark .data-table tbody tr {
      border-bottom: 1px solid #27272a;
    }

    .data-table tbody tr:hover {
      background: #fafafa;
    }

    .dark .data-table tbody tr:hover {
      background: #27272a;
    }

    .data-table td {
      padding: 1rem;
      font-size: 0.9375rem;
    }

    input, select, textarea {
      background: #fff;
      border: 1px solid #e4e4e7;
      transition: all 0.2s ease;
      font-size: 0.9375rem;
    }

    .dark input, .dark select, .dark textarea {
      background: #18181b;
      border: 1px solid #3f3f46;
      color: #fafafa;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #71717a;
      box-shadow: 0 0 0 1px #71717a;
    }

    input::placeholder, textarea::placeholder {
      color: #a1a1aa;
    }

    .dark input::placeholder, .dark textarea::placeholder {
      color: #52525b;
    }

    .card {
      background: #fff;
      border: 1px solid #f4f4f5;
      transition: all 0.25s ease;
    }

    .dark .card {
      background: #18181b;
      border: 1px solid #27272a;
    }

    .divider {
      border-color: #f4f4f5;
    }

    .dark .divider {
      border-color: #27272a;
    }

    /* Reduce visual noise */
    * {
      outline-color: #71717a;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      letter-spacing: -0.01em;
    }
  `,
};
