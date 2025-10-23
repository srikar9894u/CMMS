import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useTheme } from '../context/ThemeContext';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  location: string;
}

interface OPCConnection {
  id: number;
  name: string;
  plc_type: string;
  server_url: string;
  enabled: boolean;
  polling_interval: number;
  connection_timeout: number;
  username: string | null;
  password: string | null;
  connection_status: string;
  last_connected: string | null;
  notes: string | null;
  asset_count?: number;
}

interface OPCTag {
  id: number;
  opc_connection_id: number;
  asset_id: number;
  asset_name?: string;
  asset_tag?: string;
  tag_type: string;
  tag_name: string;
  tag_address: string;
  data_type: string;
  invert_logic: boolean;
  description: string | null;
}

const OPCConfiguration = () => {
  const { themeColors } = useTheme();
  const [connections, setConnections] = useState<OPCConnection[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<OPCConnection | null>(null);
  const [tags, setTags] = useState<OPCTag[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const [formData, setFormData] = useState({
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

  const [tagFormData, setTagFormData] = useState({
    asset_id: '',
    tag_type: 'running',
    tag_name: '',
    tag_address: '',
    data_type: 'boolean',
    invert_logic: false,
    description: '',
  });

  const plcTypes = [
    { value: 'siemens', label: 'Siemens (S7-1200/1500)' },
    { value: 'allen_bradley', label: 'Allen Bradley (ControlLogix/CompactLogix)' },
    { value: 'schneider', label: 'Schneider Electric (Modicon)' },
    { value: 'mitsubishi', label: 'Mitsubishi (iQ-R Series)' },
    { value: 'generic_opcua', label: 'Generic OPC UA Server' },
  ];

  const tagTypes = [
    { value: 'running', label: 'Running Status' },
    { value: 'trip', label: 'Trip/Fault Status' },
    { value: 'off', label: 'Off/Stopped Status' },
    { value: 'custom', label: 'Custom Tag' },
  ];

  const plcExamples: Record<string, { url: string; tags: { type: string; example: string }[] }> = {
    siemens: {
      url: 'opc.tcp://192.168.1.10:4840',
      tags: [
        { type: 'Running', example: 'ns=3;s="DataBlock_1"."Running"' },
        { type: 'Trip', example: 'ns=3;s="DataBlock_1"."Trip"' },
        { type: 'Off', example: 'ns=3;s="DataBlock_1"."Stop"' },
      ],
    },
    allen_bradley: {
      url: 'opc.tcp://192.168.1.20:49320',
      tags: [
        { type: 'Running', example: 'ns=2;s=Channel1.Device1.RunningTag' },
        { type: 'Trip', example: 'ns=2;s=Channel1.Device1.TripTag' },
        { type: 'Off', example: 'ns=2;s=Channel1.Device1.StopTag' },
      ],
    },
    schneider: {
      url: 'opc.tcp://192.168.1.30:4840',
      tags: [
        { type: 'Running', example: 'ns=4;s=%MW100' },
        { type: 'Trip', example: 'ns=4;s=%MW101' },
        { type: 'Off', example: 'ns=4;s=%MW102' },
      ],
    },
    mitsubishi: {
      url: 'opc.tcp://192.168.1.40:4840',
      tags: [
        { type: 'Running', example: 'ns=2;s=D100' },
        { type: 'Trip', example: 'ns=2;s=D101' },
        { type: 'Off', example: 'ns=2;s=D102' },
      ],
    },
    generic_opcua: {
      url: 'opc.tcp://[IP_ADDRESS]:[PORT]',
      tags: [
        { type: 'Running', example: 'ns=2;s=YourRunningTag' },
        { type: 'Trip', example: 'ns=2;s=YourTripTag' },
        { type: 'Off', example: 'ns=2;s=YourOffTag' },
      ],
    },
  };

  useEffect(() => {
    fetchConnections();
    fetchAllAssets();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get('/api/opc/connections');
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to fetch OPC connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAssets = async () => {
    try {
      const response = await axios.get('/api/opc/assets/all');
      setAllAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchTags = async (connectionId: number) => {
    try {
      const response = await axios.get(`/api/opc/connections/${connectionId}/tags`);
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (selectedConnection) {
        await axios.put(`/api/opc/connections/${selectedConnection.id}`, formData);
        setSuccess('PLC connection updated successfully!');
      } else {
        await axios.post('/api/opc/connections', formData);
        setSuccess('PLC connection created successfully!');
      }

      setIsModalOpen(false);
      fetchConnections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save PLC connection');
    }
  };

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (selectedConnection) {
        await axios.post('/api/opc/tags', {
          opc_connection_id: selectedConnection.id,
          ...tagFormData,
        });
        setSuccess('Tag added successfully!');
        fetchTags(selectedConnection.id);
        fetchConnections(); // Refresh to update asset count
        setTagFormData({
          asset_id: '',
          tag_type: 'running',
          tag_name: '',
          tag_address: '',
          data_type: 'boolean',
          invert_logic: false,
          description: '',
        });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to add tag');
    }
  };

  const handleManageTags = (connection: OPCConnection) => {
    setSelectedConnection(connection);
    fetchTags(connection.id);
    setIsTagModalOpen(true);
  };

  const handleEdit = (connection: OPCConnection) => {
    setSelectedConnection(connection);
    setFormData({
      name: connection.name,
      plc_type: connection.plc_type,
      server_url: connection.server_url,
      enabled: connection.enabled,
      polling_interval: connection.polling_interval,
      connection_timeout: connection.connection_timeout,
      username: connection.username || '',
      password: connection.password || '',
      notes: connection.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this PLC connection? This will also delete all associated tags.')) return;

    try {
      await axios.delete(`/api/opc/connections/${id}`);
      setSuccess('PLC connection deleted successfully!');
      fetchConnections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete connection');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    try {
      await axios.delete(`/api/opc/tags/${tagId}`);
      setSuccess('Tag deleted successfully!');
      if (selectedConnection) {
        fetchTags(selectedConnection.id);
        fetchConnections(); // Refresh to update asset count
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete tag');
    }
  };

  const openAddModal = () => {
    setSelectedConnection(null);
    setFormData({
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
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.disconnected;
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
            OPC UA Connectivity
          </h1>
          <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
            Manage PLC connections and asset tag mappings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            {showExamples ? 'Hide' : 'Show'} Examples
          </button>
          <button
            onClick={openAddModal}
            className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            + Add PLC Connection
          </button>
        </div>
      </div>

      {success && (
        <div className={`mb-4 ${themeColors.colors.successLight} border ${themeColors.colors.successText} px-4 py-3 rounded-lg text-sm`}>
          {success}
        </div>
      )}

      {error && (
        <div className={`mb-4 ${themeColors.colors.errorLight} border ${themeColors.colors.errorText} px-4 py-3 rounded-lg text-sm`}>
          {error}
        </div>
      )}

      {/* Example Connection Info */}
      {showExamples && (
        <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
          <h2 className={`text-lg font-bold ${themeColors.colors.textPrimary} mb-4`}>
            Connection Examples by PLC Type
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(plcExamples).map(([type, info]) => (
              <div key={type} className={`${themeColors.colors.secondary} p-4 rounded-lg`}>
                <h3 className={`font-semibold ${themeColors.colors.textPrimary} mb-2 capitalize`}>
                  {type.replace('_', ' ')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className={`font-medium ${themeColors.colors.textSecondary}`}>Server URL:</span>
                    <code className={`block ${themeColors.colors.textMuted} bg-black bg-opacity-5 px-2 py-1 rounded mt-1`}>
                      {info.url}
                    </code>
                  </div>
                  <div>
                    <span className={`font-medium ${themeColors.colors.textSecondary}`}>Tag Examples:</span>
                    {info.tags.map((tag, idx) => (
                      <div key={idx} className="ml-2 mt-1">
                        <span className={themeColors.colors.textMuted}>{tag.type}:</span>
                        <code className={`block ${themeColors.colors.textMuted} bg-black bg-opacity-5 px-2 py-1 rounded text-xs mt-0.5`}>
                          {tag.example}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className={`mt-4 text-sm ${themeColors.colors.textMuted}`}>
            💡 Tip: Use tools like UaExpert (OPC UA client) to browse your PLC's OPC server and find exact tag addresses.
          </p>
        </div>
      )}

      {/* PLC Connections Table */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${themeColors.colors.borderLight}`}>
            <thead className={`${themeColors.colors.secondary}`}>
              <tr>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  PLC Name
                </th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden md:table-cell`}>
                  PLC Type
                </th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden lg:table-cell`}>
                  Server URL
                </th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Assets
                </th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Status
                </th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${themeColors.colors.card} divide-y ${themeColors.colors.borderLight}`}>
              {connections.map((conn) => (
                <tr key={conn.id} className={themeColors.colors.cardHover}>
                  <td className={`px-4 sm:px-6 py-4 text-sm ${themeColors.colors.textPrimary}`}>
                    <div className="font-medium">{conn.name}</div>
                    <div className={`text-xs ${themeColors.colors.textMuted}`}>
                      Polling: {conn.polling_interval}ms
                    </div>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textMuted} capitalize hidden md:table-cell`}>
                    {conn.plc_type.replace('_', ' ')}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm ${themeColors.colors.textMuted} hidden lg:table-cell`}>
                    <div className="max-w-xs truncate">{conn.server_url}</div>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textPrimary}`}>
                    <span className="font-medium">{conn.asset_count || 0}</span> connected
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(conn.connection_status)}`}>
                      {conn.connection_status}
                    </span>
                    {!conn.enabled && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <button
                        onClick={() => handleManageTags(conn)}
                        className={themeColors.colors.primaryText}
                      >
                        Manage Tags
                      </button>
                      <button
                        onClick={() => handleEdit(conn)}
                        className={themeColors.colors.primaryText}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(conn.id)}
                        className={themeColors.colors.errorText}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {connections.length === 0 && (
          <div className={`text-center py-12 ${themeColors.colors.textMuted}`}>
            No PLC connections configured. Click "Add PLC Connection" to get started.
          </div>
        )}
      </div>

      {/* Add/Edit PLC Connection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedConnection ? 'Edit PLC Connection' : 'Add PLC Connection'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
              PLC Name <span className={themeColors.colors.errorText}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="Production PLC"
              required
            />
            <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
              A descriptive name for this PLC connection
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
              PLC Type <span className={themeColors.colors.errorText}>*</span>
            </label>
            <select
              value={formData.plc_type}
              onChange={(e) => setFormData({ ...formData, plc_type: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              required
            >
              {plcTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
              Server URL <span className={themeColors.colors.errorText}>*</span>
            </label>
            <input
              type="text"
              value={formData.server_url}
              onChange={(e) => setFormData({ ...formData, server_url: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="opc.tcp://192.168.1.10:4840"
              required
            />
            <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
              Example: {plcExamples[formData.plc_type]?.url}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Polling Interval (ms)
              </label>
              <input
                type="number"
                value={formData.polling_interval}
                onChange={(e) => setFormData({ ...formData, polling_interval: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                min="1000"
                step="1000"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Timeout (ms)
              </label>
              <input
                type="number"
                value={formData.connection_timeout}
                onChange={(e) => setFormData({ ...formData, connection_timeout: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                min="5000"
                step="1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Username (optional)
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Password (optional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              rows={2}
              placeholder="Additional notes about this PLC connection"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="enabled" className={`text-sm ${themeColors.colors.textSecondary}`}>
              Enable connection
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              {selectedConnection ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Tags Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title={`Manage Tags - ${selectedConnection?.name}`}
      >
        <div className="space-y-6">
          {/* Add Tag Form */}
          <form onSubmit={handleTagSubmit} className="space-y-4 pb-4 border-b">
            <h3 className={`text-lg font-semibold ${themeColors.colors.textPrimary}`}>Add New Tag</h3>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Asset <span className={themeColors.colors.errorText}>*</span>
              </label>
              <select
                value={tagFormData.asset_id}
                onChange={(e) => setTagFormData({ ...tagFormData, asset_id: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              >
                <option value="">Select Asset</option>
                {allAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.asset_tag})
                  </option>
                ))}
              </select>
              <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
                Select which asset this tag monitors
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                  Tag Type <span className={themeColors.colors.errorText}>*</span>
                </label>
                <select
                  value={tagFormData.tag_type}
                  onChange={(e) => setTagFormData({ ...tagFormData, tag_type: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  required
                >
                  {tagTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                  Tag Name <span className={themeColors.colors.errorText}>*</span>
                </label>
                <input
                  type="text"
                  value={tagFormData.tag_name}
                  onChange={(e) => setTagFormData({ ...tagFormData, tag_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                  placeholder="Motor_Running"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Tag Address (NodeId) <span className={themeColors.colors.errorText}>*</span>
              </label>
              <input
                type="text"
                value={tagFormData.tag_address}
                onChange={(e) => setTagFormData({ ...tagFormData, tag_address: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                placeholder='ns=3;s="DataBlock_1"."Running"'
                required
              />
              {selectedConnection && (
                <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>
                  Example: {plcExamples[selectedConnection.plc_type]?.tags[0]?.example}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                  Data Type
                </label>
                <select
                  value={tagFormData.data_type}
                  onChange={(e) => setTagFormData({ ...tagFormData, data_type: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                >
                  <option value="boolean">Boolean</option>
                  <option value="integer">Integer</option>
                  <option value="float">Float</option>
                  <option value="string">String</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="invert_logic"
                  checked={tagFormData.invert_logic}
                  onChange={(e) => setTagFormData({ ...tagFormData, invert_logic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="invert_logic" className={`text-sm ${themeColors.colors.textSecondary}`}>
                  Invert Logic (0=ON, 1=OFF)
                </label>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Description
              </label>
              <input
                type="text"
                value={tagFormData.description}
                onChange={(e) => setTagFormData({ ...tagFormData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                placeholder="Main motor running status"
              />
            </div>

            <button
              type="submit"
              className={`w-full ${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Add Tag
            </button>
          </form>

          {/* Tags List */}
          <div>
            <h3 className={`text-lg font-semibold ${themeColors.colors.textPrimary} mb-3`}>
              Configured Tags ({tags.length})
            </h3>

            {tags.length === 0 ? (
              <p className={`text-sm ${themeColors.colors.textMuted} text-center py-4`}>
                No tags configured. Add tags above to start monitoring assets.
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`${themeColors.colors.secondary} p-3 rounded-lg flex justify-between items-start`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800`}>
                          {tag.asset_name || `Asset ${tag.asset_id}`}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${themeColors.colors.primaryText} ${themeColors.colors.secondary}`}>
                          {tag.tag_type}
                        </span>
                        <span className={`font-medium ${themeColors.colors.textPrimary}`}>{tag.tag_name}</span>
                        {tag.invert_logic && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                            Inverted
                          </span>
                        )}
                      </div>
                      <code className={`text-xs ${themeColors.colors.textMuted} block mt-1`}>
                        {tag.tag_address}
                      </code>
                      {tag.description && (
                        <p className={`text-xs ${themeColors.colors.textMuted} mt-1`}>{tag.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className={`${themeColors.colors.errorText} text-sm ml-3`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OPCConfiguration;
