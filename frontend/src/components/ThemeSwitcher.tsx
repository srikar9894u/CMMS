import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { themes, ThemeName } from '../config/themes';

const ThemeSwitcher = () => {
  const { theme, setTheme, themeColors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const themeIcons: Record<ThemeName, string> = {
    light: '\u2600',
    dark: '\u{1F319}',
    blue: '\u{1F30A}',
    green: '\u{1F333}',
    purple: '\u{1F48E}',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textPrimary} transition-colors text-sm font-medium`}
        aria-label="Switch theme"
      >
        <span className="text-lg">{themeIcons[theme]}</span>
        <span className="hidden sm:inline">{themes[theme].name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${themeColors.colors.card} ${themeColors.colors.cardBorder} border overflow-hidden z-50`}>
          <div className="py-1">
            {Object.entries(themes).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as ThemeName)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                  theme === key
                    ? `${themeColors.colors.primaryLight} ${themeColors.colors.primaryText} font-medium`
                    : `${themeColors.colors.textSecondary} ${themeColors.colors.cardHover}`
                } transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{themeIcons[key as ThemeName]}</span>
                  <span>{value.name}</span>
                </div>
                {theme === key && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
