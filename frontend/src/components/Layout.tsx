import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

const Layout = () => {
  const { user, logout } = useAuth();
  const { themeColors } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Assets', path: '/assets', icon: '🏗️' },
    { name: 'Work Orders', path: '/work-orders', icon: '🔧' },
    { name: 'Preventive Maintenance', path: '/preventive-maintenance', icon: '⚙️' },
    { name: '52-Week Calendar', path: '/pm-calendar', icon: '📅' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Leave Management', path: '/leave', icon: '🏖️' },
    { name: 'Real-Time Status', path: '/real-time-status', icon: '🔴' },
  ];

  if (user?.role === 'admin' || user?.role === 'manager') {
    navigation.push({ name: 'OPC Configuration', path: '/opc-config', icon: '🔌' });
    navigation.push({ name: 'Users', path: '/users', icon: '👥' });
  }

  return (
    <div className={`min-h-screen ${themeColors.colors.background}`}>
      {/* Header */}
      <header className={`${themeColors.colors.foreground} shadow-sm sticky top-0 z-40`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`md:hidden p-2 rounded-lg ${themeColors.colors.secondary} ${themeColors.colors.secondaryHover}`}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center">
                <h1 className={`text-xl sm:text-2xl font-bold ${themeColors.colors.primaryText}`}>CMMS</h1>
                <span className={`ml-2 text-xs sm:text-sm ${themeColors.colors.textMuted} hidden sm:inline`}>Maintenance Management</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className={`text-xs sm:text-sm ${themeColors.colors.textSecondary} hidden sm:inline`}>
                {user?.full_name || user?.username} ({user?.role})
              </span>
              <ThemeSwitcher />
              <button
                onClick={logout}
                className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary} px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 left-0 z-40
            w-64 ${themeColors.colors.foreground} shadow-sm
            min-h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="p-2 sm:p-4 space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${
                    isActive
                      ? `${themeColors.colors.navActive} ${themeColors.colors.navActiveText} font-medium`
                      : `${themeColors.colors.navText} ${themeColors.colors.navHover}`
                  }`}
                >
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="text-sm sm:text-base">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full md:w-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
