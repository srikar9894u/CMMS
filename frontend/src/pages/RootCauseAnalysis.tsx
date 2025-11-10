import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter, TrendingUp, AlertCircle } from 'lucide-react';

interface RCAInvestigation {
  id: number;
  title: string;
  status: string;
  severity: string;
  analysis_method: string;
  created_at: string;
  asset_name?: string;
  assigned_to_name?: string;
  action_count: number;
  completed_action_count: number;
}

interface RCAStatistics {
  total_investigations: number;
  by_status: Array<{ status: string; count: number }>;
  by_severity: Array<{ severity: string; count: number }>;
  by_method: Array<{ analysis_method: string; count: number }>;
  total_cost_impact: number;
  pending_actions: number;
}

const RootCauseAnalysis = () => {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState<RCAInvestigation[]>([]);
  const [statistics, setStatistics] = useState<RCAStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    analysis_method: 'fishbone',
    severity: 'medium',
    asset_id: '',
    work_order_id: '',
    incident_date: ''
  });

  useEffect(() => {
    fetchInvestigations();
    fetchStatistics();
  }, [filterStatus, filterSeverity]);

  const fetchInvestigations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterSeverity) params.append('severity', filterSeverity);

      const response = await axios.get(`/api/rca?${params}`);
      setInvestigations(response.data);
    } catch (error) {
      console.error('Error fetching RCA investigations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/rca/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/rca', formData);
      setShowCreateModal(false);
      navigate(`/rca/${response.data.id}`);
    } catch (error) {
      console.error('Error creating RCA:', error);
      alert('Failed to create RCA investigation');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      initiated: 'bg-gray-100 text-gray-800',
      investigating: 'bg-blue-100 text-blue-800',
      analysis_complete: 'bg-yellow-100 text-yellow-800',
      actions_defined: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100';
  };

  const filteredInvestigations = investigations.filter(inv =>
    inv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.asset_name && inv.asset_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Root Cause Analysis</h1>
          <p className="text-gray-600 mt-1">Investigate failures and prevent recurrence</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Investigation
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Investigations</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_investigations}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pending_actions}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost Impact</p>
                <p className="text-2xl font-bold text-gray-900">${(statistics.total_cost_impact || 0).toLocaleString()}</p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">By Method</p>
            <div className="space-y-1">
              {statistics.by_method.slice(0, 3).map((method) => (
                <div key={method.analysis_method} className="flex justify-between text-sm">
                  <span className="text-gray-700 capitalize">{method.analysis_method.replace('_', ' ')}</span>
                  <span className="font-semibold">{method.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search investigations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="initiated">Initiated</option>
            <option value="investigating">Investigating</option>
            <option value="analysis_complete">Analysis Complete</option>
            <option value="actions_defined">Actions Defined</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-5 h-5" />
            {filteredInvestigations.length} results
          </div>
        </div>
      </div>

      {/* Investigations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investigation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvestigations.map((investigation) => (
              <tr
                key={investigation.id}
                onClick={() => navigate(`/rca/${investigation.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{investigation.title}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{investigation.asset_name || '-'}</td>
                <td className="px-6 py-4">
                  <span className="text-sm capitalize">{investigation.analysis_method.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(investigation.severity)}`}>
                    {investigation.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(investigation.status)}`}>
                    {investigation.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {investigation.completed_action_count}/{investigation.action_count}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{investigation.assigned_to_name || 'Unassigned'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(investigation.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create RCA Investigation</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Method *</label>
                  <select
                    value={formData.analysis_method}
                    onChange={(e) => setFormData({ ...formData, analysis_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="fishbone">Fishbone (Ishikawa)</option>
                    <option value="five_whys">5 Whys</option>
                    <option value="pareto">Pareto Analysis</option>
                    <option value="fault_tree">Fault Tree</option>
                    <option value="fmea">FMEA</option>
                    <option value="combined">Combined Methods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date</label>
                <input
                  type="datetime-local"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Investigation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootCauseAnalysis;
