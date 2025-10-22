import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [stats, setStats] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const [statsRes, woRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/work-orders'),
      ]);
      setStats(statsRes.data);
      setWorkOrders(woRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading reports...</div>;
  }

  // Prepare chart data
  const assetStatusData = [
    { name: 'Operational', value: stats?.assets?.operational || 0, color: '#10b981' },
    { name: 'Down', value: stats?.assets?.down || 0, color: '#ef4444' },
    { name: 'Maintenance', value: stats?.assets?.maintenance || 0, color: '#f59e0b' },
  ];

  const workOrderStatusData = [
    { name: 'Open', count: stats?.work_orders?.open || 0 },
    { name: 'In Progress', count: stats?.work_orders?.in_progress || 0 },
    { name: 'Completed', count: stats?.work_orders?.completed || 0 },
  ];

  const workOrderPriorityData = workOrders.reduce((acc: any, wo) => {
    const existing = acc.find((item: any) => item.name === wo.priority);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: wo.priority, count: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive maintenance insights and metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input w-40"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-600">Total Assets</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.assets?.total || 0}</div>
          <div className="text-xs text-green-600 mt-2">
            {stats?.assets?.operational || 0} operational
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600">Work Orders</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.work_orders?.total || 0}</div>
          <div className="text-xs text-yellow-600 mt-2">
            {stats?.work_orders?.open || 0} open
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600">PM Schedules</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.preventive_maintenance?.total || 0}</div>
          <div className="text-xs text-red-600 mt-2">
            {stats?.preventive_maintenance?.overdue || 0} overdue
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600">Inventory Items</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.inventory?.total || 0}</div>
          <div className="text-xs text-orange-600 mt-2">
            {stats?.inventory?.low_stock || 0} low stock
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Asset Status Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Work Order Status Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Order Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workOrderStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Work Order Priority Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Orders by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workOrderPriorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {workOrderPriorityData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Completion Rate */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Work Order Completion Rate</span>
                <span className="font-semibold">
                  {stats?.work_orders?.total > 0
                    ? ((stats?.work_orders?.completed / stats?.work_orders?.total) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      stats?.work_orders?.total > 0
                        ? (stats?.work_orders?.completed / stats?.work_orders?.total) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Asset Uptime</span>
                <span className="font-semibold">
                  {stats?.assets?.total > 0
                    ? ((stats?.assets?.operational / stats?.assets?.total) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      stats?.assets?.total > 0 ? (stats?.assets?.operational / stats?.assets?.total) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">PM Compliance</span>
                <span className="font-semibold">
                  {stats?.preventive_maintenance?.total > 0
                    ? (
                        ((stats?.preventive_maintenance?.total - stats?.preventive_maintenance?.overdue) /
                          stats?.preventive_maintenance?.total) *
                        100
                      ).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      stats?.preventive_maintenance?.total > 0
                        ? ((stats?.preventive_maintenance?.total - stats?.preventive_maintenance?.overdue) /
                            stats?.preventive_maintenance?.total) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Work Orders Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Work Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workOrders.slice(0, 10).map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{wo.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{wo.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{wo.asset_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`badge ${
                      wo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      wo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      wo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`badge ${
                      wo.status === 'completed' ? 'bg-green-100 text-green-800' :
                      wo.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{wo.assigned_to_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex space-x-4">
          <button className="btn btn-secondary">Export to PDF</button>
          <button className="btn btn-secondary">Export to Excel</button>
          <button className="btn btn-secondary">Print Report</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
