import { ThemeConfig } from '../types/theme.types';

export const glassmorphicModernTheme: ThemeConfig = {
  id: 'glassmorphic-modern',
  name: 'Glassmorphic Modern',
  description: 'Modern frosted glass design with vibrant gradients and depth',

  colors: {
    // Backgrounds - gradient backgrounds
    background: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20',
    foreground: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl',

    // Primary - vibrant purple/indigo
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    primaryHover: 'hover:from-indigo-600 hover:to-purple-700',
    primaryText: 'text-indigo-600 dark:text-indigo-400',

    // Secondary - glass effect
    secondary: 'bg-white/60 dark:bg-gray-700/60 backdrop-blur-md',
    secondaryHover: 'hover:bg-white/80 dark:hover:bg-gray-700/80',

    // Text
    textPrimary: 'text-gray-900 dark:text-white',
    textSecondary: 'text-gray-700 dark:text-gray-200',
    textMuted: 'text-gray-600 dark:text-gray-400',

    // Navigation - glass cards
    navActive: 'bg-white/90 dark:bg-indigo-500/20 backdrop-blur-lg border border-indigo-200/50 dark:border-indigo-400/30',
    navActiveText: 'text-indigo-700 dark:text-indigo-300',
    navHover: 'hover:bg-white/70 dark:hover:bg-gray-700/50 backdrop-blur-md',
    navText: 'text-gray-700 dark:text-gray-300',

    // Status - vibrant colors
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600',
    danger: 'bg-gradient-to-r from-rose-500 to-pink-600',
    info: 'bg-gradient-to-r from-cyan-500 to-blue-600',

    // Cards - frosted glass
    cardBg: 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl',
    cardBorder: 'border-white/50 dark:border-gray-700/50',
    border: 'border-gray-200/50 dark:border-gray-700/50',

    // Effects
    shadow: 'shadow-2xl shadow-purple-500/10',
    overlay: 'bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm',
  },

  animations: {
    fast: '200ms',
    normal: '400ms',
    slow: '600ms',

    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    fadeIn: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' },
      transition: { duration: 0.4 },
    },

    slideIn: {
      initial: { x: -30, opacity: 0, filter: 'blur(4px)' },
      animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
      exit: { x: 30, opacity: 0, filter: 'blur(4px)' },
      transition: { duration: 0.4, ease: 'easeOut' },
    },

    scaleIn: {
      initial: { scale: 0.9, opacity: 0, filter: 'blur(8px)' },
      animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
      exit: { scale: 0.9, opacity: 0, filter: 'blur(8px)' },
      transition: { duration: 0.3 },
    },

    buttonTap: {
      whileTap: { scale: 0.95 },
      whileHover: { scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' },
      transition: { duration: 0.2 },
    },

    cardHover: {
      whileHover: {
        y: -8,
        scale: 1.02,
        boxShadow: '0 20px 50px rgba(139, 92, 246, 0.15)',
      },
      transition: { duration: 0.3, ease: 'easeOut' },
    },

    modalEnter: {
      initial: { scale: 0.8, opacity: 0, filter: 'blur(20px)' },
      animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
      exit: { scale: 0.8, opacity: 0, filter: 'blur(20px)' },
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
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
    containerMaxWidth: '1400px',
    sidebarWidth: '18rem',
  },

  customCSS: `
    /* Glassmorphic Modern Custom Styles */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dark .glass-card {
      background: rgba(31, 41, 55, 0.7);
      border: 1px solid rgba(75, 85, 99, 0.5);
    }

    .glass-card:hover {
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 20px 50px rgba(139, 92, 246, 0.2);
      transform: translateY(-4px);
    }

    .dark .glass-card:hover {
      background: rgba(31, 41, 55, 0.85);
      border: 1px solid rgba(75, 85, 99, 0.8);
    }

    .btn-glass {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);
    }

    .gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .floating-animation {
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    /* Glassmorphic scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
    }
  `,
};
