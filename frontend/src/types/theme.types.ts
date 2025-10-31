// Theme configuration types for UI Engine

export interface ThemeColors {
  // Background colors
  background: string;
  foreground: string;

  // Primary colors
  primary: string;
  primaryHover: string;
  primaryText: string;

  // Secondary colors
  secondary: string;
  secondaryHover: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Navigation
  navActive: string;
  navActiveText: string;
  navHover: string;
  navText: string;

  // Status colors
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Card and borders
  cardBg: string;
  cardBorder: string;
  border: string;

  // Special effects
  shadow: string;
  overlay: string;
}

export interface ThemeAnimations {
  // Transition durations
  fast: string;
  normal: string;
  slow: string;

  // Easing functions
  easeIn: string;
  easeOut: string;
  easeInOut: string;

  // Animation variants
  fadeIn: object;
  slideIn: object;
  scaleIn: object;

  // Microinteraction settings
  buttonTap: object;
  cardHover: object;
  modalEnter: object;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFont?: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface ThemeLayout {
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  containerMaxWidth: string;
  sidebarWidth: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  animations: ThemeAnimations;
  typography: ThemeTypography;
  layout: ThemeLayout;
  customCSS?: string;
}

export type ThemeId = 'industrial-pro' | 'glassmorphic-modern' | 'compact-field' | 'neumorphic-soft' | 'bold-brutalist' | 'dashboard-executive' | 'minimal-light';

export interface UIEngineState {
  currentTheme: ThemeId;
  availableThemes: ThemeConfig[];
  animationsEnabled: boolean;
}
