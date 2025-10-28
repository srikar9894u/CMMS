import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface AssetStatus {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  real_time_status: string | null;
  last_opc_update: string | null;
  connection_status: string;
  plc_type: string;
}

interface StatusHistory {
  id: number;
  asset_id: number;
  status: string;
  running_bit: boolean;
  trip_bit: boolean;
  off_bit: boolean;
  timestamp: string;
}

const RealTimeStatus = () => {
  const { themeColors } = useTheme();
  const [statuses, setStatuses] = useState<AssetStatus[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetStatus | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  useEffect(() => {
    fetchStatuses();

    if (autoRefresh) {
      const interval = setInterval(fetchStatuses, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    if (selectedAsset) {
      fetchHistory(selectedAsset.id);
    }
  }, [selectedAsset]);

  const fetchStatuses = async () => {
    try {
      // Fetch both OPC and S7 statuses
      const [opcResponse, s7Response] = await Promise.all([
        axios.get('/api/opc/status/current').catch(() => ({ data: [] })),
        axios.get('/api/s7/status/current').catch(() => ({ data: [] }))
      ]);

      // Combine both arrays, removing duplicates by asset ID
      const combined = [...opcResponse.data, ...s7Response.data];
      const uniqueStatuses = combined.reduce((acc, current) => {
        const existing = acc.find((item: AssetStatus) => item.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as AssetStatus[]);

      setStatuses(uniqueStatuses);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (assetId: number) => {
    try {
      // Try S7 endpoint first, then OPC endpoint
      let response;
      try {
        response = await axios.get(`/api/s7/assets/${assetId}/status-history`, {
          params: { limit: 50, hours: 24 }
        });
      } catch {
        response = await axios.get(`/api/opc/assets/${assetId}/status-history`, {
          params: { limit: 50, hours: 24 }
        });
      }
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return '❓';
    const icons: Record<string, string> = {
      running: '✅',
      trip: '🔴',
      off: '⏸️',
      unknown: '❓',
    };
    return icons[status] || icons.unknown;
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      running: 'bg-green-100 text-green-800',
      trip: 'bg-red-100 text-red-800',
      off: 'bg-gray-100 text-gray-800',
      unknown: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || colors.unknown;
  };

  const getConnectionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.disconnected;
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusSummary = () => {
    const summary = {
      running: statuses.filter(s => s.real_time_status === 'running').length,
      trip: statuses.filter(s => s.real_time_status === 'trip').length,
      off: statuses.filter(s => s.real_time_status === 'off').length,
      unknown: statuses.filter(s => !s.real_time_status || s.real_time_status === 'unknown').length,
    };
    return summary;
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  const summary = getStatusSummary();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
          Real-Time Asset Status
        </h1>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className={`text-sm ${themeColors.colors.textSecondary}`}>Auto-refresh</span>
          </label>
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className={`px-3 py-1.5 rounded-lg border text-sm ${themeColors.colors.input}`}
            >
              <option value="3000">3s</option>
              <option value="5000">5s</option>
              <option value="10000">10s</option>
              <option value="30000">30s</option>
            </select>
          )}
          <button
            onClick={fetchStatuses}
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeColors.colors.textMuted}`}>Running</p>
              <p className={`text-2xl font-bold text-green-600`}>{summary.running}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeColors.colors.textMuted}`}>Tripped</p>
              <p className={`text-2xl font-bold text-red-600`}>{summary.trip}</p>
            </div>
            <div className="text-3xl">🔴</div>
          </div>
        </div>

        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeColors.colors.textMuted}`}>Stopped</p>
              <p className={`text-2xl font-bold text-gray-600`}>{summary.off}</p>
            </div>
            <div className="text-3xl">⏸️</div>
          </div>
        </div>

        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeColors.colors.textMuted}`}>Unknown</p>
              <p className={`text-2xl font-bold text-yellow-600`}>{summary.unknown}</p>
            </div>
            <div className="text-3xl">❓</div>
          </div>
        </div>
      </div>

      {/* Assets Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {statuses.map((asset) => (
          <div
            key={asset.id}
            onClick={() => setSelectedAsset(asset)}
            className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className={`font-semibold ${themeColors.colors.textPrimary}`}>{asset.name}</h3>
                <p className={`text-xs ${themeColors.colors.textMuted}`}>
                  {asset.asset_tag} • {asset.category}
                </p>
              </div>
              <span className="text-3xl">{getStatusIcon(asset.real_time_status)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${themeColors.colors.textSecondary}`}>Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.real_time_status)}`}>
                  {asset.real_time_status?.toUpperCase() || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm ${themeColors.colors.textSecondary}`}>Connection:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConnectionStatusColor(asset.connection_status)}`}>
                  {asset.connection_status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm ${themeColors.colors.textSecondary}`}>Last Update:</span>
                <span className={`text-xs ${themeColors.colors.textMuted}`}>
                  {getTimeAgo(asset.last_opc_update)}
                </span>
              </div>

              <div className="pt-2 border-t">
                <span className={`text-xs ${themeColors.colors.textMuted} capitalize`}>
                  {asset.plc_type.replace('_', ' ')} PLC
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-12 text-center`}>
          <p className={`${themeColors.colors.textMuted} mb-4`}>
            No OPC-enabled assets found. Configure OPC connections to start monitoring.
          </p>
          <a
            href="/opc-config"
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block`}
          >
            Configure OPC Connections
          </a>
        </div>
      )}

      {/* History Panel */}
      {selectedAsset && (
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 mt-6`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${themeColors.colors.textPrimary}`}>
              Status History - {selectedAsset.name}
            </h2>
            <button
              onClick={() => setSelectedAsset(null)}
              className={`${themeColors.colors.textMuted} hover:${themeColors.colors.textPrimary}`}
            >
              ✕ Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${themeColors.colors.borderLight}`}>
              <thead className={`${themeColors.colors.secondary}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                    Timestamp
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden md:table-cell`}>
                    Running
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden md:table-cell`}>
                    Trip
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden md:table-cell`}>
                    Off
                  </th>
                </tr>
              </thead>
              <tbody className={`${themeColors.colors.card} divide-y ${themeColors.colors.borderLight}`}>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td className={`px-4 py-3 text-sm ${themeColors.colors.textPrimary}`}>
                      {formatTimestamp(record.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeColors.colors.textMuted} hidden md:table-cell`}>
                      {record.running_bit ? '✓' : '✗'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeColors.colors.textMuted} hidden md:table-cell`}>
                      {record.trip_bit ? '✓' : '✗'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${themeColors.colors.textMuted} hidden md:table-cell`}>
                      {record.off_bit ? '✓' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length === 0 && (
              <div className={`text-center py-8 ${themeColors.colors.textMuted}`}>
                No history available for this asset yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeStatus;
