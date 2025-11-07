import { ThemeConfig } from '../types/theme.types';

export const dashboardExecutiveTheme: ThemeConfig = {
  id: 'dashboard-executive',
  name: 'Dashboard Executive',
  description: 'Professional, elegant design focused on data visualization and executive dashboards',

  colors: {
    // Backgrounds
    background: 'bg-slate-50 dark:bg-slate-950',
    foreground: 'bg-white dark:bg-slate-900',

    // Primary
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    primaryText: 'text-indigo-600 dark:text-indigo-400',

    // Secondary
    secondary: 'bg-slate-100 dark:bg-slate-800',
    secondaryHover: 'hover:bg-slate-200 dark:hover:bg-slate-700',

    // Text
    textPrimary: 'text-slate-900 dark:text-slate-50',
    textSecondary: 'text-slate-700 dark:text-slate-300',
    textMuted: 'text-slate-500 dark:text-slate-400',

    // Navigation
    navActive: 'bg-indigo-50 dark:bg-indigo-950/30',
    navActiveText: 'text-indigo-700 dark:text-indigo-300',
    navHover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    navText: 'text-slate-700 dark:text-slate-300',

    // Status
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',

    // Cards
    cardBg: 'bg-white dark:bg-slate-900',
    cardBorder: 'border-slate-200 dark:border-slate-800',
    border: 'border-slate-200 dark:border-slate-700',

    // Effects
    shadow: 'shadow-lg',
    overlay: 'bg-slate-900/60',
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
      initial: { x: -15, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 15, opacity: 0 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },

    scaleIn: {
      initial: { scale: 0.97, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.97, opacity: 0 },
      transition: { duration: 0.25 },
    },

    buttonTap: {
      whileTap: { scale: 0.97 },
      whileHover: { scale: 1.01 },
      transition: { duration: 0.15 },
    },

    cardHover: {
      whileHover: {
        y: -2,
        boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
      },
      transition: { duration: 0.25 },
    },

    modalEnter: {
      initial: { scale: 0.96, opacity: 0, y: 20 },
      animate: { scale: 1, opacity: 1, y: 0 },
      exit: { scale: 0.96, opacity: 0, y: 20 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },

  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
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
    containerMaxWidth: '1440px',
    sidebarWidth: '18rem',
  },

  customCSS: `
    /* Dashboard Executive Custom Styles */
    .btn-primary {
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .btn-primary:hover {
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
      transform: translateY(-1px);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .stat-card {
      background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%);
      border-left: 4px solid #4f46e5;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .dark .stat-card {
      background: linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%);
    }

    .stat-card:hover {
      transform: translateX(4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    }

    .stat-card .stat-value {
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      font-size: 2rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .data-table {
      border-collapse: separate;
      border-spacing: 0;
      font-variant-numeric: tabular-nums;
    }

    .data-table thead {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 2px solid #4f46e5;
    }

    .dark .data-table thead {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .data-table th {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      color: #64748b;
      padding: 1rem;
    }

    .data-table tbody tr {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }

    .dark .data-table tbody tr {
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }

    .data-table tbody tr:hover {
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transform: scale(1.005);
    }

    .dark .data-table tbody tr:hover {
      background: #1e293b;
    }

    .chart-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;
    }

    .dark .chart-card {
      background: #0f172a;
      border: 1px solid #334155;
    }

    .chart-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .kpi-indicator {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
    }

    .kpi-indicator.positive {
      background: #d1fae5;
      color: #065f46;
    }

    .kpi-indicator.negative {
      background: #fee2e2;
      color: #991b1b;
    }

    .dark .kpi-indicator.positive {
      background: #064e3b;
      color: #6ee7b7;
    }

    .dark .kpi-indicator.negative {
      background: #7f1d1d;
      color: #fca5a5;
    }

    .metric-sparkline {
      height: 32px;
      margin-top: 0.5rem;
    }

    input, select, textarea {
      transition: all 0.2s ease;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      border-color: #4f46e5;
    }
  `,
};
