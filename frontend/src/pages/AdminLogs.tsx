import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface LogEntry {
  id: number;
  log_level: string;
  source: string;
  message: string;
  details: string | null;
  user_id: number | null;
  username: string | null;
  full_name: string | null;
  ip_address: string | null;
  timestamp: string;
}

interface LogStats {
  log_level: string;
  count: number;
  last_occurrence: string;
}

const AdminLogs = () => {
  const { themeColors } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [hours, setHours] = useState(24);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchStats();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [filterLevel, filterSource, hours, autoRefresh]);

  const fetchLogs = async () => {
    try {
      const params: any = { hours, limit: 100 };
      if (filterLevel) params.level = filterLevel;
      if (filterSource) params.source = filterSource;

      const response = await axios.get('/api/system/logs', { params });
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/system/logs/stats', {
        params: { hours }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch log stats:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLevelBadge = (level: string) => {
    const colorClass = getLevelColor(level);
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${colorClass}`}>
        {level}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
          Application Logs
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
          <button
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.log_level} className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${themeColors.colors.textSecondary}`}>{stat.log_level}</span>
              {getLevelBadge(stat.log_level)}
            </div>
            <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mb-1`}>{stat.count}</div>
            <p className={`text-xs ${themeColors.colors.textMuted}`}>
              Last: {getRelativeTime(stat.last_occurrence)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Log Level
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Source
            </label>
            <input
              type="text"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              placeholder="Filter by source..."
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Time Range
            </label>
            <select
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="1">Last Hour</option>
              <option value="6">Last 6 Hours</option>
              <option value="24">Last 24 Hours</option>
              <option value="72">Last 3 Days</option>
              <option value="168">Last Week</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Actions
            </label>
            <button
              onClick={() => {
                setFilterLevel('');
                setFilterSource('');
                setHours(24);
              }}
              className={`w-full ${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className={themeColors.colors.secondary}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Timestamp
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Level
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Source
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Message
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden lg:table-cell`}>
                  User
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${themeColors.colors.card} divide-y ${themeColors.colors.borderLight}`}>
              {logs.map((log) => (
                <tr key={log.id} className={themeColors.colors.cardHover}>
                  <td className={`px-4 py-3 text-sm ${themeColors.colors.textMuted} whitespace-nowrap`}>
                    <div>{formatTimestamp(log.timestamp)}</div>
                    <div className="text-xs">{getRelativeTime(log.timestamp)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {getLevelBadge(log.log_level)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeColors.colors.textPrimary}`}>
                    <span className="font-mono text-xs">{log.source}</span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeColors.colors.textPrimary} max-w-md`}>
                    <div className="truncate">{log.message}</div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeColors.colors.textMuted} hidden lg:table-cell`}>
                    {log.username || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className={`${themeColors.colors.infoText} hover:underline`}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className={`text-center py-12 ${themeColors.colors.textMuted}`}>
              No logs found for the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeColors.colors.card} rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto`}>
            <div className={`sticky top-0 ${themeColors.colors.card} border-b px-6 py-4 flex justify-between items-center`}>
              <h3 className={`text-lg font-semibold ${themeColors.colors.textPrimary}`}>Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className={`${themeColors.colors.textMuted} hover:${themeColors.colors.textPrimary}`}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Level</label>
                <div>{getLevelBadge(selectedLog.log_level)}</div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Timestamp</label>
                <p className={themeColors.colors.textPrimary}>{formatTimestamp(selectedLog.timestamp)}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Source</label>
                <p className={`${themeColors.colors.textPrimary} font-mono text-sm`}>{selectedLog.source}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Message</label>
                <p className={themeColors.colors.textPrimary}>{selectedLog.message}</p>
              </div>
              {selectedLog.details && (
                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Details</label>
                  <pre className={`${themeColors.colors.secondary} p-4 rounded text-sm overflow-x-auto`}>
                    {selectedLog.details}
                  </pre>
                </div>
              )}
              {selectedLog.username && (
                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>User</label>
                  <p className={themeColors.colors.textPrimary}>
                    {selectedLog.full_name} ({selectedLog.username})
                  </p>
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>IP Address</label>
                  <p className={themeColors.colors.textPrimary}>{selectedLog.ip_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
