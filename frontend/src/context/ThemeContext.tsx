import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { themes, ThemeColors, ThemeName, getThemeByName } from '../config/themes';
import { useAuth } from './AuthContext';
import { useUIEngine } from './UIEngineContext';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeColors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isLoading: uiEngineLoading } = useUIEngine();
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Try to get theme from localStorage first
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    return savedTheme && themes[savedTheme] ? savedTheme : 'light';
  });

  // Update theme when user changes (e.g., after login)
  useEffect(() => {
    if (user?.theme && themes[user.theme as ThemeName]) {
      setThemeState(user.theme as ThemeName);
      localStorage.setItem('theme', user.theme);
    }
  }, [user?.theme]);

  // Apply theme class to document root
  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple');
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);

    // Apply dark mode class if dark theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Update user theme in backend if user is logged in
    if (user?.id) {
      try {
        await axios.put(`/api/users/${user.id}`, { theme: newTheme });
      } catch (error) {
        console.error('Failed to update user theme:', error);
      }
    }
  };

  const themeColors = getThemeByName(theme);

  // Show loading state while UI Engine initializes
  if (uiEngineLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading UI Theme...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
