import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useTheme } from '../context/ThemeContext';

interface Connection {
  id: number;
  name: string;
  plc_type: string;
  enabled: boolean;
  polling_interval: number;
  connection_timeout: number;
  connection_status: string;
  last_connected: string | null;
  notes: string | null;
  connection_type: 'opc' | 's7';

  // OPC-specific
  server_url?: string;
  username?: string | null;
  password?: string | null;

  // S7-specific
  ip_address?: string;
  rack?: number;
  slot?: number;

  connected_assets?: number;
}

interface Tag {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_tag: string;
  tag_type: string;
  tag_name: string;
  tag_address: string;
  data_type: string;
  invert_logic: boolean;
  description: string | null;
  connection_type: 'opc' | 's7';
  connection_id: number;
  connection_name: string;
}

const PLCConfiguration = () => {
  const { themeColors } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionTypeFilter, setConnectionTypeFilter] = useState<'all' | 'opc' | 's7'>('all');

  // Modals
  const [isAddConnectionModalOpen, setIsAddConnectionModalOpen] = useState(false);
  const [isViewTagsModalOpen, setIsViewTagsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Connection Form
  const [connectionType, setConnectionType] = useState<'opc' | 's7'>('opc');
  const [opcFormData, setOpcFormData] = useState({
    name: '',
    plc_type: 'siemens',
    server_url: '',
    enabled: true,
    polling_interval: 5000,
    connection_timeout: 10000,
    username: '',
    password: '',
    notes: '',
  });

  const [s7FormData, setS7FormData] = useState({
    name: '',
    plc_type: 's7-1200',
    ip_address: '',
    rack: 0,
    slot: 1,
    enabled: true,
    polling_interval: 5000,
    connection_timeout: 10000,
    notes: '',
  });

  const plcTypes = {
    opc: [
      { value: 'siemens', label: 'Siemens (S7-1200/1500)' },
      { value: 'allen_bradley', label: 'Allen Bradley (ControlLogix/CompactLogix)' },
      { value: 'schneider', label: 'Schneider Electric (Modicon)' },
      { value: 'mitsubishi', label: 'Mitsubishi (iQ-R Series)' },
      { value: 'generic_opcua', label: 'Generic OPC UA Server' },
    ],
    s7: [
      { value: 's7-1200', label: 'S7-1200' },
      { value: 's7-1500', label: 'S7-1500' },
      { value: 's7-300', label: 'S7-300' },
      { value: 's7-400', label: 'S7-400' },
    ],
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [opcConns, s7Conns] = await Promise.all([
        axios.get('http://localhost:3000/api/opc/connections'),
        axios.get('http://localhost:3000/api/s7/connections')
      ]);

      const allConnections: Connection[] = [
        ...opcConns.data.map((c: any) => ({ ...c, connection_type: 'opc' as const })),
        ...s7Conns.data.map((c: any) => ({ ...c, connection_type: 's7' as const }))
      ];

      setConnections(allConnections);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load PLC configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (connectionType === 'opc') {
        await axios.post('http://localhost:3000/api/opc/connections', opcFormData);
        setSuccess('OPC UA connection added successfully');
      } else {
        await axios.post('http://localhost:3000/api/s7/connections', s7FormData);
        setSuccess('S7 PLC connection added successfully');
      }

      setIsAddConnectionModalOpen(false);
      fetchData();

      // Reset forms
      setOpcFormData({
        name: '',
        plc_type: 'siemens',
        server_url: '',
        enabled: true,
        polling_interval: 5000,
        connection_timeout: 10000,
        username: '',
        password: '',
        notes: '',
      });
      setS7FormData({
        name: '',
        plc_type: 's7-1200',
        ip_address: '',
        rack: 0,
        slot: 1,
        enabled: true,
        polling_interval: 5000,
        connection_timeout: 10000,
        notes: '',
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to add connection');
    }
  };

  const handleDeleteConnection = async (connection: Connection) => {
    if (!confirm(`Are you sure you want to delete ${connection.name}? This will also delete all associated tags.`)) {
      return;
    }

    try {
      const endpoint = connection.connection_type === 'opc'
        ? `http://localhost:3000/api/opc/connections/${connection.id}`
        : `http://localhost:3000/api/s7/connections/${connection.id}`;

      await axios.delete(endpoint);
      setSuccess(`${connection.name} deleted successfully`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete connection');
    }
  };

  const handleViewTags = async (connection: Connection) => {
    setSelectedConnection(connection);
    setIsViewTagsModalOpen(true);

    try {
      const endpoint = connection.connection_type === 'opc'
        ? `http://localhost:3000/api/opc/connections/${connection.id}/tags`
        : `http://localhost:3000/api/s7/connections/${connection.id}/tags`;

      const response = await axios.get(endpoint);
      const tagsWithType = response.data.map((tag: any) => ({
        ...tag,
        connection_type: connection.connection_type,
        connection_id: connection.id,
        connection_name: connection.name
      }));
      setTags(tagsWithType);
    } catch (error: any) {
      console.error('Failed to fetch tags:', error);
      setError('Failed to load tags');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      connected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      disconnected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      connecting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const filteredConnections = connectionTypeFilter === 'all'
    ? connections
    : connections.filter(c => c.connection_type === connectionTypeFilter);

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
            PLC Configuration
          </h1>
          <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
            Manage OPC UA and S7 PLC connections and tags
          </p>
        </div>

        <button
          onClick={() => setIsAddConnectionModalOpen(true)}
          className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
        >
          ➕ Add Connection
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Total Connections</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {connections.length}
          </div>
        </div>

        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>OPC UA</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {connections.filter(c => c.connection_type === 'opc').length}
          </div>
        </div>

        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>S7 PLC</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {connections.filter(c => c.connection_type === 's7').length}
          </div>
        </div>

        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Connected</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {connections.filter(c => c.connection_status === 'connected').length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setConnectionTypeFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            connectionTypeFilter === 'all'
              ? `${themeColors.colors.primary} text-white`
              : `${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary}`
          }`}
        >
          All ({connections.length})
        </button>
        <button
          onClick={() => setConnectionTypeFilter('opc')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            connectionTypeFilter === 'opc'
              ? `${themeColors.colors.primary} text-white`
              : `${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary}`
          }`}
        >
          OPC UA ({connections.filter(c => c.connection_type === 'opc').length})
        </button>
        <button
          onClick={() => setConnectionTypeFilter('s7')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            connectionTypeFilter === 's7'
              ? `${themeColors.colors.primary} text-white`
              : `${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary}`
          }`}
        >
          S7 PLC ({connections.filter(c => c.connection_type === 's7').length})
        </button>
      </div>

      {/* Connections Table */}
      <div className={`${themeColors.colors.card} rounded-lg shadow-sm overflow-hidden border ${themeColors.colors.cardBorder}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={themeColors.colors.secondary}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  PLC Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Connection Info
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Assets
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${themeColors.colors.card} divide-y divide-gray-200 dark:divide-gray-700`}>
              {filteredConnections.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-6 py-4 text-center ${themeColors.colors.textMuted}`}>
                    No PLC connections found. Add your first connection to get started.
                  </td>
                </tr>
              ) : (
                filteredConnections.map((connection) => (
                  <tr key={`${connection.connection_type}-${connection.id}`} className={themeColors.colors.cardHover}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        connection.connection_type === 'opc'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {connection.connection_type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${themeColors.colors.textPrimary}`}>
                      <div className="font-medium">{connection.name}</div>
                      {connection.notes && (
                        <div className={`text-sm ${themeColors.colors.textMuted}`}>{connection.notes}</div>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                      {connection.plc_type}
                    </td>
                    <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                      {connection.connection_type === 'opc' ? (
                        <div>
                          <div className="font-mono text-xs">{connection.server_url}</div>
                          {connection.username && (
                            <div className={`text-xs ${themeColors.colors.textMuted}`}>
                              User: {connection.username}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-mono text-xs">{connection.ip_address}</div>
                          <div className={`text-xs ${themeColors.colors.textMuted}`}>
                            Rack: {connection.rack}, Slot: {connection.slot}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(connection.connection_status || 'disconnected')}`}>
                        {connection.connection_status || 'disconnected'}
                      </span>
                      {connection.enabled === false && (
                        <div className="text-xs text-gray-500 mt-1">(Disabled)</div>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                      {connection.connected_assets || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewTags(connection)}
                          className={`${themeColors.colors.primaryText} hover:underline`}
                        >
                          View Tags
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(connection)}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Connection Modal */}
      <Modal
        isOpen={isAddConnectionModalOpen}
        onClose={() => setIsAddConnectionModalOpen(false)}
        title="Add PLC Connection"
      >
        <form onSubmit={handleAddConnection} className="space-y-4">
          {/* Connection Type Selector */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Connection Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="opc"
                  checked={connectionType === 'opc'}
                  onChange={(e) => setConnectionType(e.target.value as 'opc' | 's7')}
                  className="mr-2"
                />
                <span className={themeColors.colors.textPrimary}>OPC UA</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="s7"
                  checked={connectionType === 's7'}
                  onChange={(e) => setConnectionType(e.target.value as 'opc' | 's7')}
                  className="mr-2"
                />
                <span className={themeColors.colors.textPrimary}>S7 PLC (Snap7)</span>
              </label>
            </div>
          </div>

          {/* OPC UA Form */}
          {connectionType === 'opc' && (
            <>
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                  Connection Name *
                </label>
                <input
                  type="text"
                  value={opcFormData.name}
                  onChange={(e) => setOpcFormData({ ...opcFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  placeholder="e.g., Main Production Line PLC"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                  PLC Type *
                </label>
                <select
                  value={opcFormData.plc_type}
                  onChange={(e) => setOpcFormData({ ...opcFormData, plc_type: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  required
                >
                  {plcTypes.opc.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                  OPC UA Server URL *
                </label>
                <input
                  type="text"
                  value={opcFormData.server_url}
                  onChange={(e) => setOpcFormData({ ...opcFormData, server_url: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  placeholder="opc.tcp://192.168.1.10:4840"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={opcFormData.username}
                    onChange={(e) => setOpcFormData({ ...opcFormData, username: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={opcFormData.password}
                    onChange={(e) => setOpcFormData({ ...opcFormData, password: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  />
                </div>
              </div>
            </>
          )}

          {/* S7 PLC Form */}
          {connectionType === 's7' && (
            <>
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                  Connection Name *
                </label>
                <input
                  type="text"
                  value={s7FormData.name}
                  onChange={(e) => setS7FormData({ ...s7FormData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  placeholder="e.g., Packaging Line S7-1200"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                  PLC Type *
                </label>
                <select
                  value={s7FormData.plc_type}
                  onChange={(e) => setS7FormData({ ...s7FormData, plc_type: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  required
                >
                  {plcTypes.s7.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                  IP Address *
                </label>
                <input
                  type="text"
                  value={s7FormData.ip_address}
                  onChange={(e) => setS7FormData({ ...s7FormData, ip_address: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  placeholder="192.168.1.10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                    Rack *
                  </label>
                  <input
                    type="number"
                    value={s7FormData.rack}
                    onChange={(e) => setS7FormData({ ...s7FormData, rack: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                    Slot *
                  </label>
                  <input
                    type="number"
                    value={s7FormData.slot}
                    onChange={(e) => setS7FormData({ ...s7FormData, slot: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                    min="0"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Common Fields */}
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Notes
            </label>
            <textarea
              value={connectionType === 'opc' ? opcFormData.notes : s7FormData.notes}
              onChange={(e) => {
                if (connectionType === 'opc') {
                  setOpcFormData({ ...opcFormData, notes: e.target.value });
                } else {
                  setS7FormData({ ...s7FormData, notes: e.target.value });
                }
              }}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsAddConnectionModalOpen(false)}
              className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.textSecondary} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Add Connection
            </button>
          </div>
        </form>
      </Modal>

      {/* View Tags Modal */}
      <Modal
        isOpen={isViewTagsModalOpen}
        onClose={() => {
          setIsViewTagsModalOpen(false);
          setSelectedConnection(null);
          setTags([]);
        }}
        title={`Tags for ${selectedConnection?.name}`}
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-lg ${themeColors.colors.secondary}`}>
            <p className={`text-sm ${themeColors.colors.textSecondary}`}>
              To add or manage tags, use the Tags Management page from the main navigation.
            </p>
          </div>

          {tags.length === 0 ? (
            <div className={`text-center py-8 ${themeColors.colors.textMuted}`}>
              No tags configured for this connection yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div key={tag.id} className={`p-4 rounded-lg border ${themeColors.colors.cardBorder} ${themeColors.colors.card}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className={`font-medium ${themeColors.colors.textPrimary}`}>
                        {tag.asset_name} ({tag.asset_tag})
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        tag.tag_type === 'running'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : tag.tag_type === 'trip'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : tag.tag_type === 'off'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {tag.tag_type}
                      </span>
                    </div>
                    {tag.invert_logic && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Inverted
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${themeColors.colors.textMuted} space-y-1`}>
                    <div><strong>Tag Name:</strong> {tag.tag_name}</div>
                    <div><strong>Address:</strong> <code className="font-mono text-xs">{tag.tag_address}</code></div>
                    {tag.description && <div><strong>Description:</strong> {tag.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PLCConfiguration;
