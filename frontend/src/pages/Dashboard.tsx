import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import {
  AnimatedCounter,
  GradientText,
  PulseIcon,
  ShimmerCard,
  Skeleton,
  AnimatedCard,
  StatusBadge,
} from '../components/animations';
import {
  RESPONSIVE_TEXT,
  RESPONSIVE_GRID,
  RESPONSIVE_GAP,
  RESPONSIVE_PADDING,
  TOUCH_TARGET,
} from '../utils/responsive';

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
    return (
      <div>
        <Skeleton variant="text" width="300px" height="40px" className="mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <ShimmerCard key={i} height="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className={`${RESPONSIVE_TEXT.h1} font-bold mb-6 sm:mb-8`}>
        <GradientText
          from="from-blue-600"
          via="via-purple-600"
          to="to-pink-600"
        >
          Dashboard
        </GradientText>
      </h1>

      <div className={`grid ${RESPONSIVE_GRID.stats} ${RESPONSIVE_GAP.medium} mb-6 sm:mb-8`}>
        {/* Assets Card */}
        <AnimatedCard data-testid="dashboard-assets-card" className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 data-testid="assets-card-title" className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Assets</h3>
            <PulseIcon>
              <span className="text-2xl sm:text-3xl">🏗️</span>
            </PulseIcon>
          </div>
          <div className="space-y-2">
            <AnimatedCounter
              value={stats?.assets.total || 0}
              className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}
              data-testid="assets-total-count"
            />
            <div className="flex flex-col gap-2 mt-3" data-testid="assets-status-badges">
              <StatusBadge status="success" label={`Operational: ${stats?.assets.operational || 0}`} />
              <StatusBadge status="error" label={`Down: ${stats?.assets.down || 0}`} pulse={(stats?.assets.down || 0) > 0} />
              <StatusBadge status="warning" label={`Maintenance: ${stats?.assets.maintenance || 0}`} />
            </div>
          </div>
        </AnimatedCard>

        {/* Work Orders Card */}
        <AnimatedCard data-testid="dashboard-workorders-card" className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 data-testid="workorders-card-title" className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Work Orders</h3>
            <PulseIcon>
              <span className="text-2xl sm:text-3xl">🔧</span>
            </PulseIcon>
          </div>
          <div className="space-y-2" data-testid="workorders-status-container">
            <AnimatedCounter
              value={stats?.work_orders.total || 0}
              className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}
            />
            <div className="flex flex-col gap-2 mt-3">
              <StatusBadge status="info" label={`Open: ${stats?.work_orders.open || 0}`} />
              <StatusBadge status="warning" label={`In Progress: ${stats?.work_orders.in_progress || 0}`} />
              <StatusBadge status="error" label={`Urgent: ${stats?.work_orders.urgent || 0}`} pulse={(stats?.work_orders.urgent || 0) > 0} />
            </div>
          </div>
        </AnimatedCard>

        {/* Preventive Maintenance Card */}
        <AnimatedCard className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Preventive Maint.</h3>
            <PulseIcon>
              <span className="text-2xl sm:text-3xl">⚙️</span>
            </PulseIcon>
          </div>
          <div className="space-y-2">
            <AnimatedCounter
              value={stats?.preventive_maintenance.total || 0}
              className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}
            />
            <div className="flex flex-col gap-2 mt-3">
              <StatusBadge
                status="error"
                label={`Overdue: ${stats?.preventive_maintenance.overdue || 0}`}
                pulse={(stats?.preventive_maintenance.overdue || 0) > 0}
              />
              <StatusBadge
                status="warning"
                label={`Due Soon: ${stats?.preventive_maintenance.due_soon || 0}`}
              />
            </div>
          </div>
        </AnimatedCard>

        {/* Inventory Card */}
        <AnimatedCard className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${themeColors.colors.textSecondary}`}>Inventory</h3>
            <PulseIcon>
              <span className="text-2xl sm:text-3xl">📦</span>
            </PulseIcon>
          </div>
          <div className="space-y-2">
            <AnimatedCounter
              value={stats?.inventory.total || 0}
              className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}
            />
            <div className="flex flex-col gap-2 mt-3">
              <StatusBadge
                status="error"
                label={`Low Stock: ${stats?.inventory.low_stock || 0}`}
                pulse={(stats?.inventory.low_stock || 0) > 0}
              />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm ${RESPONSIVE_PADDING.card}`}>
        <h2 className={`${RESPONSIVE_TEXT.h3} font-semibold ${themeColors.colors.textPrimary} mb-4`}>Quick Actions</h2>
        <div className={`grid ${RESPONSIVE_GRID.stats} ${RESPONSIVE_GAP.small}`}>
          <a
            href="/work-orders"
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 ${TOUCH_TARGET.medium} rounded-lg text-center font-medium transition-colors ${RESPONSIVE_TEXT.body} flex items-center justify-center`}
          >
            New Work Order
          </a>
          <a
            href="/assets"
            className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 ${TOUCH_TARGET.medium} rounded-lg text-center font-medium transition-colors ${RESPONSIVE_TEXT.body} flex items-center justify-center`}
          >
            View Assets
          </a>
          <a
            href="/preventive-maintenance"
            className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 ${TOUCH_TARGET.medium} rounded-lg text-center font-medium transition-colors ${RESPONSIVE_TEXT.body} flex items-center justify-center`}
          >
            PM Schedule
          </a>
          <a
            href="/inventory"
            className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 ${TOUCH_TARGET.medium} rounded-lg text-center font-medium transition-colors ${RESPONSIVE_TEXT.body} flex items-center justify-center`}
          >
            Check Inventory
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
