export interface ThemeColors {
  name: string;
  colors: {
    // Backgrounds
    background: string;
    foreground: string;
    card: string;
    cardBorder: string;
    cardHover: string;

    // Primary colors
    primary: string;
    primaryHover: string;
    primaryText: string;
    primaryLight: string;

    // Secondary colors
    secondary: string;
    secondaryHover: string;
    secondaryText: string;

    // Accent colors
    accent: string;
    accentHover: string;
    accentText: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Border and input
    border: string;
    borderLight: string;
    input: string;
    inputFocus: string;
    inputBorder: string;

    // Status colors
    success: string;
    successLight: string;
    successText: string;
    warning: string;
    warningLight: string;
    warningText: string;
    error: string;
    errorLight: string;
    errorText: string;
    info: string;
    infoLight: string;
    infoText: string;

    // Navigation
    navActive: string;
    navActiveText: string;
    navHover: string;
    navText: string;

    // Badge
    badgeOperational: string;
    badgeDown: string;
    badgeMaintenance: string;
    badgeRetired: string;
  };
}

export const themes: Record<string, ThemeColors> = {
  light: {
    name: 'Light',
    colors: {
      // Backgrounds
      background: 'bg-gray-50',
      foreground: 'bg-white',
      card: 'bg-white',
      cardBorder: 'border-gray-200',
      cardHover: 'hover:bg-gray-50',

      // Primary colors
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryText: 'text-blue-600',
      primaryLight: 'bg-blue-50',

      // Secondary colors
      secondary: 'bg-gray-100',
      secondaryHover: 'hover:bg-gray-200',
      secondaryText: 'text-gray-700',

      // Accent colors
      accent: 'bg-indigo-600',
      accentHover: 'hover:bg-indigo-700',
      accentText: 'text-indigo-600',

      // Text colors
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textMuted: 'text-gray-500',

      // Border and input
      border: 'border-gray-300',
      borderLight: 'border-gray-200',
      input: 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
      inputFocus: 'focus:border-blue-500 focus:ring-blue-500',
      inputBorder: 'border-gray-300',

      // Status colors
      success: 'bg-green-600',
      successLight: 'bg-green-50 border-green-200',
      successText: 'text-green-700',
      warning: 'bg-yellow-500',
      warningLight: 'bg-yellow-50 border-yellow-200',
      warningText: 'text-yellow-700',
      error: 'bg-red-600',
      errorLight: 'bg-red-50 border-red-200',
      errorText: 'text-red-700',
      info: 'bg-blue-600',
      infoLight: 'bg-blue-50 border-blue-200',
      infoText: 'text-blue-700',

      // Navigation
      navActive: 'bg-blue-50',
      navActiveText: 'text-blue-700',
      navHover: 'hover:bg-gray-50',
      navText: 'text-gray-700',

      // Badge
      badgeOperational: 'bg-green-100 text-green-800',
      badgeDown: 'bg-red-100 text-red-800',
      badgeMaintenance: 'bg-yellow-100 text-yellow-800',
      badgeRetired: 'bg-gray-100 text-gray-800',
    }
  },

  dark: {
    name: 'Dark',
    colors: {
      // Backgrounds
      background: 'bg-gray-900',
      foreground: 'bg-gray-800',
      card: 'bg-gray-800',
      cardBorder: 'border-gray-700',
      cardHover: 'hover:bg-gray-750',

      // Primary colors
      primary: 'bg-blue-500',
      primaryHover: 'hover:bg-blue-600',
      primaryText: 'text-blue-400',
      primaryLight: 'bg-blue-900',

      // Secondary colors
      secondary: 'bg-gray-700',
      secondaryHover: 'hover:bg-gray-600',
      secondaryText: 'text-gray-300',

      // Accent colors
      accent: 'bg-indigo-500',
      accentHover: 'hover:bg-indigo-600',
      accentText: 'text-indigo-400',

      // Text colors
      textPrimary: 'text-gray-100',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',

      // Border and input
      border: 'border-gray-600',
      borderLight: 'border-gray-700',
      input: 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-400 focus:ring-blue-400',
      inputFocus: 'focus:border-blue-400 focus:ring-blue-400',
      inputBorder: 'border-gray-600',

      // Status colors
      success: 'bg-green-500',
      successLight: 'bg-green-900 border-green-700',
      successText: 'text-green-400',
      warning: 'bg-yellow-500',
      warningLight: 'bg-yellow-900 border-yellow-700',
      warningText: 'text-yellow-400',
      error: 'bg-red-500',
      errorLight: 'bg-red-900 border-red-700',
      errorText: 'text-red-400',
      info: 'bg-blue-500',
      infoLight: 'bg-blue-900 border-blue-700',
      infoText: 'text-blue-400',

      // Navigation
      navActive: 'bg-gray-700',
      navActiveText: 'text-blue-400',
      navHover: 'hover:bg-gray-700',
      navText: 'text-gray-300',

      // Badge
      badgeOperational: 'bg-green-900 text-green-300',
      badgeDown: 'bg-red-900 text-red-300',
      badgeMaintenance: 'bg-yellow-900 text-yellow-300',
      badgeRetired: 'bg-gray-700 text-gray-300',
    }
  },

  blue: {
    name: 'Blue Ocean',
    colors: {
      // Backgrounds
      background: 'bg-blue-50',
      foreground: 'bg-white',
      card: 'bg-white',
      cardBorder: 'border-blue-200',
      cardHover: 'hover:bg-blue-50',

      // Primary colors
      primary: 'bg-blue-700',
      primaryHover: 'hover:bg-blue-800',
      primaryText: 'text-blue-700',
      primaryLight: 'bg-blue-100',

      // Secondary colors
      secondary: 'bg-blue-100',
      secondaryHover: 'hover:bg-blue-200',
      secondaryText: 'text-blue-800',

      // Accent colors
      accent: 'bg-cyan-600',
      accentHover: 'hover:bg-cyan-700',
      accentText: 'text-cyan-700',

      // Text colors
      textPrimary: 'text-blue-950',
      textSecondary: 'text-blue-800',
      textMuted: 'text-blue-600',

      // Border and input
      border: 'border-blue-300',
      borderLight: 'border-blue-200',
      input: 'bg-white border-blue-300 text-blue-900 focus:border-blue-600 focus:ring-blue-600',
      inputFocus: 'focus:border-blue-600 focus:ring-blue-600',
      inputBorder: 'border-blue-300',

      // Status colors
      success: 'bg-green-600',
      successLight: 'bg-green-50 border-green-200',
      successText: 'text-green-700',
      warning: 'bg-orange-500',
      warningLight: 'bg-orange-50 border-orange-200',
      warningText: 'text-orange-700',
      error: 'bg-red-600',
      errorLight: 'bg-red-50 border-red-200',
      errorText: 'text-red-700',
      info: 'bg-blue-600',
      infoLight: 'bg-blue-100 border-blue-300',
      infoText: 'text-blue-800',

      // Navigation
      navActive: 'bg-blue-100',
      navActiveText: 'text-blue-800',
      navHover: 'hover:bg-blue-50',
      navText: 'text-blue-700',

      // Badge
      badgeOperational: 'bg-green-100 text-green-800',
      badgeDown: 'bg-red-100 text-red-800',
      badgeMaintenance: 'bg-orange-100 text-orange-800',
      badgeRetired: 'bg-gray-100 text-gray-800',
    }
  },

  green: {
    name: 'Green Nature',
    colors: {
      // Backgrounds
      background: 'bg-green-50',
      foreground: 'bg-white',
      card: 'bg-white',
      cardBorder: 'border-green-200',
      cardHover: 'hover:bg-green-50',

      // Primary colors
      primary: 'bg-green-700',
      primaryHover: 'hover:bg-green-800',
      primaryText: 'text-green-700',
      primaryLight: 'bg-green-100',

      // Secondary colors
      secondary: 'bg-green-100',
      secondaryHover: 'hover:bg-green-200',
      secondaryText: 'text-green-800',

      // Accent colors
      accent: 'bg-emerald-600',
      accentHover: 'hover:bg-emerald-700',
      accentText: 'text-emerald-700',

      // Text colors
      textPrimary: 'text-green-950',
      textSecondary: 'text-green-800',
      textMuted: 'text-green-600',

      // Border and input
      border: 'border-green-300',
      borderLight: 'border-green-200',
      input: 'bg-white border-green-300 text-green-900 focus:border-green-600 focus:ring-green-600',
      inputFocus: 'focus:border-green-600 focus:ring-green-600',
      inputBorder: 'border-green-300',

      // Status colors
      success: 'bg-green-600',
      successLight: 'bg-green-100 border-green-300',
      successText: 'text-green-800',
      warning: 'bg-yellow-500',
      warningLight: 'bg-yellow-50 border-yellow-200',
      warningText: 'text-yellow-700',
      error: 'bg-red-600',
      errorLight: 'bg-red-50 border-red-200',
      errorText: 'text-red-700',
      info: 'bg-blue-600',
      infoLight: 'bg-blue-50 border-blue-200',
      infoText: 'text-blue-700',

      // Navigation
      navActive: 'bg-green-100',
      navActiveText: 'text-green-800',
      navHover: 'hover:bg-green-50',
      navText: 'text-green-700',

      // Badge
      badgeOperational: 'bg-green-200 text-green-900',
      badgeDown: 'bg-red-100 text-red-800',
      badgeMaintenance: 'bg-yellow-100 text-yellow-800',
      badgeRetired: 'bg-gray-100 text-gray-800',
    }
  },

  purple: {
    name: 'Purple Majesty',
    colors: {
      // Backgrounds
      background: 'bg-purple-50',
      foreground: 'bg-white',
      card: 'bg-white',
      cardBorder: 'border-purple-200',
      cardHover: 'hover:bg-purple-50',

      // Primary colors
      primary: 'bg-purple-700',
      primaryHover: 'hover:bg-purple-800',
      primaryText: 'text-purple-700',
      primaryLight: 'bg-purple-100',

      // Secondary colors
      secondary: 'bg-purple-100',
      secondaryHover: 'hover:bg-purple-200',
      secondaryText: 'text-purple-800',

      // Accent colors
      accent: 'bg-pink-600',
      accentHover: 'hover:bg-pink-700',
      accentText: 'text-pink-700',

      // Text colors
      textPrimary: 'text-purple-950',
      textSecondary: 'text-purple-800',
      textMuted: 'text-purple-600',

      // Border and input
      border: 'border-purple-300',
      borderLight: 'border-purple-200',
      input: 'bg-white border-purple-300 text-purple-900 focus:border-purple-600 focus:ring-purple-600',
      inputFocus: 'focus:border-purple-600 focus:ring-purple-600',
      inputBorder: 'border-purple-300',

      // Status colors
      success: 'bg-green-600',
      successLight: 'bg-green-50 border-green-200',
      successText: 'text-green-700',
      warning: 'bg-yellow-500',
      warningLight: 'bg-yellow-50 border-yellow-200',
      warningText: 'text-yellow-700',
      error: 'bg-red-600',
      errorLight: 'bg-red-50 border-red-200',
      errorText: 'text-red-700',
      info: 'bg-purple-600',
      infoLight: 'bg-purple-100 border-purple-300',
      infoText: 'text-purple-800',

      // Navigation
      navActive: 'bg-purple-100',
      navActiveText: 'text-purple-800',
      navHover: 'hover:bg-purple-50',
      navText: 'text-purple-700',

      // Badge
      badgeOperational: 'bg-green-100 text-green-800',
      badgeDown: 'bg-red-100 text-red-800',
      badgeMaintenance: 'bg-yellow-100 text-yellow-800',
      badgeRetired: 'bg-gray-100 text-gray-800',
    }
  }
};

export type ThemeName = keyof typeof themes;

export const getThemeByName = (name: ThemeName = 'light'): ThemeColors => {
  return themes[name] || themes.light;
};
