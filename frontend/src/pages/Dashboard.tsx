import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface DashboardStats {
  assets: {
    total: number;
    operational: number;
    down: number;
    maintenance: number;
  };
  work_orders: {
    total: number;
    open: number;
    in_progress: number;
    completed: number;
    urgent: number;
  };
  preventive_maintenance: {
    total: number;
    overdue: number;
    due_soon: number;
  };
  inventory: {
    total: number;
    low_stock: number;
  };
}

const Dashboard = () => {
  const { themeColors } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${themeColors.colors.textPrimary} mb-6 sm:mb-8`}>Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Assets Card */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 transition-all ${themeColors.colors.cardHover}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Assets</h3>
            <span className="text-2xl sm:text-3xl">🏗️</span>
          </div>
          <div className="space-y-2">
            <div className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>{stats?.assets.total || 0}</div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.successText}>✓ Operational: {stats?.assets.operational || 0}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.errorText}>✗ Down: {stats?.assets.down || 0}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.warningText}>⚙ Maintenance: {stats?.assets.maintenance || 0}</span>
            </div>
          </div>
        </div>

        {/* Work Orders Card */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 transition-all ${themeColors.colors.cardHover}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Work Orders</h3>
            <span className="text-2xl sm:text-3xl">🔧</span>
          </div>
          <div className="space-y-2">
            <div className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>{stats?.work_orders.total || 0}</div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.infoText}>Open: {stats?.work_orders.open || 0}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.warningText}>In Progress: {stats?.work_orders.in_progress || 0}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.errorText}>Urgent: {stats?.work_orders.urgent || 0}</span>
            </div>
          </div>
        </div>

        {/* Preventive Maintenance Card */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 transition-all ${themeColors.colors.cardHover}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Preventive Maint.</h3>
            <span className="text-2xl sm:text-3xl">⚙️</span>
          </div>
          <div className="space-y-2">
            <div className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>{stats?.preventive_maintenance.total || 0}</div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.errorText}>Overdue: {stats?.preventive_maintenance.overdue || 0}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.warningText}>Due Soon: {stats?.preventive_maintenance.due_soon || 0}</span>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 transition-all ${themeColors.colors.cardHover}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Inventory</h3>
            <span className="text-2xl sm:text-3xl">📦</span>
          </div>
          <div className="space-y-2">
            <div className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>{stats?.inventory.total || 0}</div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className={themeColors.colors.errorText}>Low Stock: {stats?.inventory.low_stock || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6`}>
        <h2 className={`text-lg sm:text-xl font-semibold ${themeColors.colors.textPrimary} mb-4`}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a href="/work-orders" className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-3 rounded-lg text-center font-medium transition-colors text-sm sm:text-base`}>
            New Work Order
          </a>
          <a href="/assets" className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 py-3 rounded-lg text-center font-medium transition-colors text-sm sm:text-base`}>
            View Assets
          </a>
          <a href="/preventive-maintenance" className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 py-3 rounded-lg text-center font-medium transition-colors text-sm sm:text-base`}>
            PM Schedule
          </a>
          <a href="/inventory" className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 py-3 rounded-lg text-center font-medium transition-colors text-sm sm:text-base`}>
            Check Inventory
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
