import { useEffect, useState } from 'react';
import axios from 'axios';

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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Assets Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Assets</h3>
            <span className="text-3xl">🏗️</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats?.assets.total || 0}</div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">✓ Operational: {stats?.assets.operational || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">✗ Down: {stats?.assets.down || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">⚙ Maintenance: {stats?.assets.maintenance || 0}</span>
            </div>
          </div>
        </div>

        {/* Work Orders Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Work Orders</h3>
            <span className="text-3xl">🔧</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats?.work_orders.total || 0}</div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Open: {stats?.work_orders.open || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">In Progress: {stats?.work_orders.in_progress || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Urgent: {stats?.work_orders.urgent || 0}</span>
            </div>
          </div>
        </div>

        {/* Preventive Maintenance Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Preventive Maint.</h3>
            <span className="text-3xl">⚙️</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats?.preventive_maintenance.total || 0}</div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Overdue: {stats?.preventive_maintenance.overdue || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Due Soon: {stats?.preventive_maintenance.due_soon || 0}</span>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Inventory</h3>
            <span className="text-3xl">📦</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats?.inventory.total || 0}</div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Low Stock: {stats?.inventory.low_stock || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/work-orders" className="btn btn-primary text-center">
            New Work Order
          </a>
          <a href="/assets" className="btn btn-secondary text-center">
            View Assets
          </a>
          <a href="/preventive-maintenance" className="btn btn-secondary text-center">
            PM Schedule
          </a>
          <a href="/inventory" className="btn btn-secondary text-center">
            Check Inventory
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
