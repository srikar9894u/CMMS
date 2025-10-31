import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/Modal';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  location: string;
}

interface TripReport {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_tag: string;
  trip_time: string;
  trip_reason: string;
  description: string;
  reported_by: number;
  reported_by_name: string;
  work_order_id: number | null;
  work_order_title: string | null;
  work_order_status: string | null;
  status: string;
  created_at: string;
}

const TripFeedback = () => {
  const { themeColors } = useTheme();
  const [reports, setReports] = useState<TripReport[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    asset_id: '',
    trip_time: new Date().toISOString().slice(0, 16),
    trip_reason: '',
    description: ''
  });

  useEffect(() => {
    fetchReports();
    fetchAssets();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/trip-feedback');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch trip reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/assets');
      setAssets(response.data.filter((a: Asset) => a.name)); // Filter out any invalid assets
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.trip_time) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('http://localhost:3000/api/trip-feedback', formData);

      alert('Trip feedback submitted successfully! A work order has been created automatically.');

      // Reset form
      setFormData({
        asset_id: '',
        trip_time: new Date().toISOString().slice(0, 16),
        trip_reason: '',
        description: ''
      });

      setShowReportModal(false);
      fetchReports();
    } catch (error: any) {
      console.error('Failed to submit trip feedback:', error);
      alert(error.response?.data?.error || 'Failed to submit trip feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      work_order_created: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getWorkOrderStatusBadge = (status: string | null) => {
    if (!status) return null;

    const badges: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
            Trip Feedback
          </h1>
          <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
            Report equipment trips and automatically create work orders
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
        >
          🚨 Report Trip
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Total Trips</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {reports.length}
          </div>
        </div>

        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Pending</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {reports.filter(r => r.status === 'pending').length}
          </div>
        </div>

        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Work Orders Created</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {reports.filter(r => r.work_order_id).length}
          </div>
        </div>

        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Resolved</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {reports.filter(r => r.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Trip Reports Table */}
      <div className={`${themeColors.colors.card} rounded-lg shadow-sm overflow-hidden border ${themeColors.colors.cardBorder}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={themeColors.colors.secondary}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Asset
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Trip Time
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Reason
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Reported By
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Work Order
                </th>
              </tr>
            </thead>
            <tbody className={`${themeColors.colors.card} divide-y divide-gray-200 dark:divide-gray-700`}>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-6 py-4 text-center ${themeColors.colors.textMuted}`}>
                    No trip reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className={themeColors.colors.cardHover}>
                    <td className={`px-6 py-4 ${themeColors.colors.textPrimary}`}>
                      <div className="font-medium">{report.asset_name}</div>
                      <div className={`text-sm ${themeColors.colors.textMuted}`}>{report.asset_tag}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                      {new Date(report.trip_time).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                      {report.trip_reason || 'Not specified'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                      {report.reported_by_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.work_order_id ? (
                        <div>
                          <div className={`text-sm font-medium ${themeColors.colors.primaryText}`}>
                            #{report.work_order_id}
                          </div>
                          {report.work_order_status && (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getWorkOrderStatusBadge(report.work_order_status)}`}>
                              {report.work_order_status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`text-sm ${themeColors.colors.textMuted}`}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Trip Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Equipment Trip"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Asset *
            </label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              required
            >
              <option value="">Select Asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_tag})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Trip Time *
            </label>
            <input
              type="datetime-local"
              value={formData.trip_time}
              onChange={(e) => setFormData({ ...formData, trip_time: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Trip Reason
            </label>
            <select
              value={formData.trip_reason}
              onChange={(e) => setFormData({ ...formData, trip_reason: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">Select or specify below</option>
              <option value="Overload">Overload</option>
              <option value="Short Circuit">Short Circuit</option>
              <option value="Earth Fault">Earth Fault</option>
              <option value="Undervoltage">Undervoltage</option>
              <option value="Overvoltage">Overvoltage</option>
              <option value="Phase Failure">Phase Failure</option>
              <option value="Motor Overheating">Motor Overheating</option>
              <option value="MCB Trip">MCB Trip</option>
              <option value="MCCB Trip">MCCB Trip</option>
              <option value="Relay Trip">Relay Trip</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Description / Additional Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              rows={4}
              placeholder="Describe what happened, what you observed, any actions taken..."
            />
          </div>

          <div className={`p-3 rounded-lg ${themeColors.colors.secondary}`}>
            <p className={`text-sm ${themeColors.colors.textSecondary}`}>
              ℹ️ A corrective work order will be created automatically with <strong>URGENT</strong> priority when you submit this report.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              disabled={submitting}
              className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50`}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TripFeedback;
