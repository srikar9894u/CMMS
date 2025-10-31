import { useState } from 'react';
import { useUIEngine } from '../context/UIEngineContext';
import { useTheme } from '../context/ThemeContext';

const ThemeSelector = () => {
  const { currentTheme, themeId, availableThemes, setTheme, animationsEnabled, toggleAnimations } = useUIEngine();
  const { themeColors } = useTheme();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThemeChange = async (newThemeId: string) => {
    try {
      setIsChanging(true);
      setError(null);
      await setTheme(newThemeId as any);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change theme');
    } finally {
      setIsChanging(false);
    }
  };

  const handleAnimationsToggle = async () => {
    try {
      setError(null);
      await toggleAnimations(!animationsEnabled);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle animations');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Theme Display */}
      <div className={`${themeColors.colors.card} rounded-lg p-6 border ${themeColors.colors.cardBorder}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xl font-semibold ${themeColors.colors.textPrimary}`}>
              UI Theme Engine
            </h3>
            <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
              Current theme: <span className="font-medium">{currentTheme.name}</span>
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${themeColors.colors.secondary}`}>
            <span className={`text-sm font-medium ${themeColors.colors.textSecondary}`}>
              Global Theme
            </span>
          </div>
        </div>
        <p className={`text-sm ${themeColors.colors.textSecondary}`}>
          {currentTheme.description}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Available Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableThemes.map((theme) => {
          const isActive = theme.id === themeId;
          return (
            <div
              key={theme.id}
              className={`
                ${themeColors.colors.card} rounded-lg p-6 border-2 transition-all cursor-pointer
                ${isActive
                  ? `${themeColors.colors.primary} border-blue-600 dark:border-blue-400`
                  : `${themeColors.colors.cardBorder} hover:border-blue-400 dark:hover:border-blue-500`
                }
                ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !isChanging && !isActive && handleThemeChange(theme.id)}
            >
              {/* Theme Preview */}
              <div className="mb-4 h-24 rounded-lg overflow-hidden relative">
                {theme.id === 'industrial-pro' && (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <div className="text-white text-xs font-semibold">Industrial Pro</div>
                  </div>
                )}
                {theme.id === 'glassmorphic-modern' && (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 backdrop-blur-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-md"></div>
                    <div className="text-white text-xs font-semibold relative z-10">Glassmorphic</div>
                  </div>
                )}
                {theme.id === 'compact-field' && (
                  <div className="w-full h-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center">
                    <div className="text-white text-xs font-semibold">Compact Field</div>
                  </div>
                )}
              </div>

              {/* Theme Info */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className={`font-semibold ${themeColors.colors.textPrimary}`}>
                    {theme.name}
                  </h4>
                  {isActive && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                {isActive && (
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <p className={`text-xs ${themeColors.colors.textMuted}`}>
                {theme.description}
              </p>

              {/* Theme Features */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded ${themeColors.colors.secondary} ${themeColors.colors.textSecondary}`}>
                  {theme.layout.containerMaxWidth}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${themeColors.colors.secondary} ${themeColors.colors.textSecondary}`}>
                  {theme.typography.fontFamily.split(',')[0]}
                </span>
              </div>

              {!isActive && (
                <button
                  disabled={isChanging}
                  className={`
                    mt-4 w-full py-2 rounded-lg font-medium text-sm transition-colors
                    ${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isChanging ? 'Applying...' : 'Apply Theme'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Animation Settings */}
      <div className={`${themeColors.colors.card} rounded-lg p-6 border ${themeColors.colors.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-semibold ${themeColors.colors.textPrimary}`}>
              Animations & Transitions
            </h4>
            <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
              Enable smooth animations and microinteractions across the application
            </p>
          </div>
          <button
            onClick={handleAnimationsToggle}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              ${animationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                ${animationsEnabled ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Theme Info */}
      <div className={`${themeColors.colors.card} rounded-lg p-6 border ${themeColors.colors.cardBorder}`}>
        <h4 className={`font-semibold ${themeColors.colors.textPrimary} mb-3`}>
          About UI Themes
        </h4>
        <ul className={`space-y-2 text-sm ${themeColors.colors.textSecondary}`}>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Theme changes apply globally to all users</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Page will reload to apply the new theme</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Each theme is optimized for different use cases and preferences</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ThemeSelector;
