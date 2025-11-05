import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';
import axios from 'axios';
import { RESPONSIVE_PADDING, TOUCH_TARGET } from '../utils/responsive';

const Layout = () => {
  const { user, logout } = useAuth();
  const { themeColors } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState('CMMS');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    // Fetch company branding
    const fetchBranding = async () => {
      try {
        const [nameRes, logoRes] = await Promise.all([
          axios.get('/api/system/settings/company_name').catch(() => ({ data: { setting_value: 'CMMS' } })),
          axios.get('/api/system/settings/company_logo').catch(() => ({ data: { setting_value: null } }))
        ]);

        setCompanyName(nameRes.data.setting_value || 'CMMS');

        // Prepend backend URL to logo path if it exists
        const logoPath = logoRes.data.setting_value;
        if (logoPath) {
          setCompanyLogo(`http://localhost:3000${logoPath}`);
        } else {
          setCompanyLogo(null);
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      }
    };

    fetchBranding();
  }, []);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Assets', path: '/assets', icon: '🏗️' },
    { name: 'Work Orders', path: '/work-orders', icon: '🔧' },
    { name: 'Preventive Maintenance', path: '/preventive-maintenance', icon: '⚙️' },
    { name: '52-Week Calendar', path: '/pm-calendar', icon: '📅' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Document Library', path: '/documents', icon: '📚' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Leave Management', path: '/leave', icon: '🏖️' },
    { name: 'Notifications', path: '/notifications', icon: '🔔' },
    { name: 'Real-Time Status', path: '/real-time-status', icon: '🔴' },
  ];

  // Add Trip Feedback for electrical sub-role users
  if (user?.sub_role === 'electrical') {
    navigation.push({ name: 'Trip Feedback', path: '/trip-feedback', icon: '🚨' });
  }

  if (user?.role === 'admin' || user?.role === 'manager') {
    navigation.push({ name: 'PLC Configuration', path: '/plc-config', icon: '🔌' });
    navigation.push({ name: 'Tags Management', path: '/tags-management', icon: '🏷️' });
    navigation.push({ name: 'Users', path: '/users', icon: '👥' });
  }

  if (user?.role === 'admin') {
    navigation.push({ name: 'System Health', path: '/system-health', icon: '💚' });
    navigation.push({ name: 'Admin Logs', path: '/admin-logs', icon: '📋' });
    navigation.push({ name: 'System Settings', path: '/system-settings', icon: '⚙️' });
  }

  return (
    <div className={`min-h-screen ${themeColors.colors.background}`}>
      {/* Header */}
      <header className={`${themeColors.colors.foreground} shadow-sm sticky top-0 z-40`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button - Touch-friendly */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`md:hidden ${TOUCH_TARGET.medium} flex items-center justify-center rounded-lg ${themeColors.colors.secondary} ${themeColors.colors.secondaryHover}`}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <div className="flex items-center gap-3">
                {companyLogo && (
                  <img
                    src={companyLogo}
                    alt={`${companyName} Logo`}
                    className="h-8 sm:h-10 w-auto object-contain"
                  />
                )}
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold ${themeColors.colors.primaryText}`}>{companyName}</h1>
                  <span className={`text-xs ${themeColors.colors.textMuted} hidden sm:block`}>Maintenance Management</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className={`text-xs sm:text-sm ${themeColors.colors.textSecondary} hidden sm:inline`}>
                {user?.full_name || user?.username} ({user?.role})
              </span>
              <ThemeSwitcher />
              <button
                onClick={logout}
                className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary} px-4 ${TOUCH_TARGET.medium} rounded-lg text-xs sm:text-sm font-medium transition-colors`}
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
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 left-0 z-30
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
                  className={`flex items-center space-x-3 px-3 sm:px-4 ${TOUCH_TARGET.medium} rounded-lg transition-colors ${
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
        <main className={`flex-1 ${RESPONSIVE_PADDING.page} w-full md:w-auto`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
