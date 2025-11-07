import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { ThemeConfig, ThemeId } from '../types/theme.types';
import { industrialProTheme } from '../themes/industrial-pro.theme';
import { glassmorphicModernTheme } from '../themes/glassmorphic-modern.theme';
import { compactFieldTheme } from '../themes/compact-field.theme';
import { neumorphicSoftTheme } from '../themes/neumorphic-soft.theme';
import { boldBrutalistTheme } from '../themes/bold-brutalist.theme';
import { dashboardExecutiveTheme } from '../themes/dashboard-executive.theme';
import { minimalLightTheme } from '../themes/minimal-light.theme';

interface UIEngineContextType {
  currentTheme: ThemeConfig;
  themeId: ThemeId;
  availableThemes: ThemeConfig[];
  animationsEnabled: boolean;
  setTheme: (themeId: ThemeId) => Promise<void>;
  toggleAnimations: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
}

const UIEngineContext = createContext<UIEngineContextType | undefined>(undefined);

// Theme registry
const THEME_REGISTRY: Record<ThemeId, ThemeConfig> = {
  'industrial-pro': industrialProTheme,
  'glassmorphic-modern': glassmorphicModernTheme,
  'compact-field': compactFieldTheme,
  'neumorphic-soft': neumorphicSoftTheme,
  'bold-brutalist': boldBrutalistTheme,
  'dashboard-executive': dashboardExecutiveTheme,
  'minimal-light': minimalLightTheme,
};

export const UIEngineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>('industrial-pro');
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(industrialProTheme);
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // All available themes
  const availableThemes: ThemeConfig[] = [
    industrialProTheme,
    glassmorphicModernTheme,
    compactFieldTheme,
    neumorphicSoftTheme,
    boldBrutalistTheme,
    dashboardExecutiveTheme,
    minimalLightTheme,
  ];

  // Load theme from backend on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch current theme setting
        const [themeRes, animationsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/system/settings/ui_theme', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { setting_value: 'industrial-pro' } })),
          axios.get('http://localhost:3000/api/system/settings/animations_enabled', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { setting_value: 'true' } }))
        ]);

        const loadedThemeId = (themeRes.data.setting_value || 'industrial-pro') as ThemeId;
        const loadedAnimations = animationsRes.data.setting_value === 'true' || animationsRes.data.setting_value === true;

        setThemeId(loadedThemeId);
        setCurrentTheme(THEME_REGISTRY[loadedThemeId]);
        setAnimationsEnabled(loadedAnimations);

        // Inject custom CSS if theme has it
        injectThemeCSS(THEME_REGISTRY[loadedThemeId]);
      } catch (error) {
        console.error('Failed to load UI theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Inject custom CSS into document head
  const injectThemeCSS = (theme: ThemeConfig) => {
    // Remove previous theme CSS
    const existingStyle = document.getElementById('ui-engine-theme-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Inject new theme CSS
    if (theme.customCSS) {
      const style = document.createElement('style');
      style.id = 'ui-engine-theme-css';
      style.textContent = theme.customCSS;
      document.head.appendChild(style);
    }

    // Update CSS variables for animations
    document.documentElement.style.setProperty('--transition-fast', theme.animations.fast);
    document.documentElement.style.setProperty('--transition-normal', theme.animations.normal);
    document.documentElement.style.setProperty('--transition-slow', theme.animations.slow);
  };

  // Set theme (admin only - but enforcement is on backend)
  const setTheme = async (newThemeId: ThemeId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Update backend
      await axios.put(
        'http://localhost:3000/api/system/settings/ui_theme',
        { setting_value: newThemeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setThemeId(newThemeId);
      const newTheme = THEME_REGISTRY[newThemeId];
      setCurrentTheme(newTheme);
      injectThemeCSS(newTheme);

      // Force reload to apply theme globally (optional - for immediate effect)
      window.location.reload();
    } catch (error) {
      console.error('Failed to set theme:', error);
      throw error;
    }
  };

  // Toggle animations
  const toggleAnimations = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Update backend
      await axios.put(
        'http://localhost:3000/api/system/settings/animations_enabled',
        { setting_value: enabled.toString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setAnimationsEnabled(enabled);

      // Apply to document
      if (enabled) {
        document.documentElement.classList.remove('no-animations');
      } else {
        document.documentElement.classList.add('no-animations');
      }
    } catch (error) {
      console.error('Failed to toggle animations:', error);
      throw error;
    }
  };

  return (
    <UIEngineContext.Provider
      value={{
        currentTheme,
        themeId,
        availableThemes,
        animationsEnabled,
        setTheme,
        toggleAnimations,
        isLoading,
      }}
    >
      {children}
    </UIEngineContext.Provider>
  );
};

export const useUIEngine = () => {
  const context = useContext(UIEngineContext);
  if (context === undefined) {
    throw new Error('useUIEngine must be used within a UIEngineProvider');
  }
  return context;
};
