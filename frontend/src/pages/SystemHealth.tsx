import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface ServiceStatus {
  status: string;
  uptime?: number;
  memory?: any;
  connections?: number;
}

interface SystemHealth {
  timestamp: string;
  status: string;
  services: {
    backend: ServiceStatus;
    database: ServiceStatus;
    opc_service: ServiceStatus;
    s7_service: ServiceStatus;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    uptime: number;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    loadAverage: number[];
  };
}

const SystemHealth = () => {
  const { themeColors } = useTheme();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      const response = await axios.get('/api/system/health');
      setHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'connected':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'no_connections':
        return 'bg-blue-500';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'connected':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'no_connections':
        return 'ℹ';
      case 'error':
      case 'disconnected':
        return '✗';
      default:
        return '?';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '<1m';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  const memoryUsagePercent = health ? ((health.system.totalMemory - health.system.freeMemory) / health.system.totalMemory * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
          System Health Monitor
        </h1>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className={`text-sm ${themeColors.colors.textSecondary}`}>Auto-refresh (10s)</span>
          </label>
          <button
            onClick={fetchHealth}
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary} mb-2`}>Overall System Status</h2>
            <p className={`text-sm ${themeColors.colors.textMuted}`}>
              Last updated: {health && new Date(health.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-white font-semibold ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}>
              <span className="mr-2">{health && getStatusIcon(health.status)}</span>
              {health?.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Services Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Backend Service */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`font-semibold ${themeColors.colors.textPrimary}`}>Backend API</h3>
              <p className={`text-xs ${themeColors.colors.textMuted}`}>Node.js</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${health && getStatusColor(health.services.backend.status)}`}></div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Status:</span>
              <span className={`font-medium ${themeColors.colors.textPrimary}`}>{health?.services.backend.status}</span>
            </div>
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Uptime:</span>
              <span className={themeColors.colors.textMuted}>{health && formatUptime(health.services.backend.uptime || 0)}</span>
            </div>
          </div>
        </div>

        {/* Database Service */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`font-semibold ${themeColors.colors.textPrimary}`}>Database</h3>
              <p className={`text-xs ${themeColors.colors.textMuted}`}>SQLite</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${health && getStatusColor(health.services.database.status)}`}></div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Status:</span>
              <span className={`font-medium ${themeColors.colors.textPrimary}`}>{health?.services.database.status}</span>
            </div>
          </div>
        </div>

        {/* OPC Service */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`font-semibold ${themeColors.colors.textPrimary}`}>OPC UA Service</h3>
              <p className={`text-xs ${themeColors.colors.textMuted}`}>Python/asyncua</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${health && getStatusColor(health.services.opc_service.status)}`}></div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Status:</span>
              <span className={`font-medium ${themeColors.colors.textPrimary}`}>{health?.services.opc_service.status}</span>
            </div>
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Active:</span>
              <span className={themeColors.colors.textMuted}>{health?.services.opc_service.connections || 0} PLCs</span>
            </div>
          </div>
        </div>

        {/* S7 Service */}
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`font-semibold ${themeColors.colors.textPrimary}`}>S7 Service</h3>
              <p className={`text-xs ${themeColors.colors.textMuted}`}>Python/snap7</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${health && getStatusColor(health.services.s7_service.status)}`}></div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Status:</span>
              <span className={`font-medium ${themeColors.colors.textPrimary}`}>{health?.services.s7_service.status}</span>
            </div>
            <div className="flex justify-between">
              <span className={themeColors.colors.textSecondary}>Active:</span>
              <span className={themeColors.colors.textMuted}>{health?.services.s7_service.connections || 0} PLCs</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-6`}>
        <h2 className={`text-xl font-semibold ${themeColors.colors.textPrimary} mb-4`}>System Resources</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Memory Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${themeColors.colors.textSecondary}`}>Memory Usage</span>
              <span className={`text-sm ${themeColors.colors.textMuted}`}>{memoryUsagePercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${memoryUsagePercent}%` }}></div>
            </div>
            <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
              {health && formatBytes(health.system.totalMemory - health.system.freeMemory)} / {health && formatBytes(health.system.totalMemory)}
            </p>
          </div>

          {/* System Information */}
          <div>
            <h3 className={`text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>System Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className={themeColors.colors.textMuted}>Platform:</span>
                <span className={themeColors.colors.textPrimary}>{health?.system.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className={themeColors.colors.textMuted}>CPUs:</span>
                <span className={themeColors.colors.textPrimary}>{health?.system.cpus}</span>
              </div>
              <div className="flex justify-between">
                <span className={themeColors.colors.textMuted}>Uptime:</span>
                <span className={themeColors.colors.textPrimary}>{health && formatUptime(health.system.uptime)}</span>
              </div>
            </div>
          </div>

          {/* Load Average */}
          <div>
            <h3 className={`text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>Load Average</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className={themeColors.colors.textMuted}>1 min:</span>
                <span className={themeColors.colors.textPrimary}>{health?.system.loadAverage[0].toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={themeColors.colors.textMuted}>5 min:</span>
                <span className={themeColors.colors.textPrimary}>{health?.system.loadAverage[1].toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={themeColors.colors.textMuted}>15 min:</span>
                <span className={themeColors.colors.textPrimary}>{health?.system.loadAverage[2].toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
