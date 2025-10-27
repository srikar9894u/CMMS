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

interface S7Connection {
  id: number;
  name: string;
  plc_type: string;
  ip_address: string;
  rack: number;
  slot: number;
  enabled: boolean;
  polling_interval: number;
  connection_timeout: number;
  connection_status: string;
  last_connected: string | null;
  notes: string | null;
  connected_assets?: number;
}

interface S7Tag {
  id: number;
  s7_connection_id: number;
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

const S7Configuration = () => {
  const { themeColors } = useTheme();
  const [connections, setConnections] = useState<S7Connection[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<S7Connection | null>(null);
  const [tags, setTags] = useState<S7Tag[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    plc_type: 'S7-300',
    ip_address: '',
    rack: 0,
    slot: 2,
    enabled: true,
    polling_interval: 5000,
    connection_timeout: 10000,
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
    { value: 'S7-300', label: 'Siemens S7-300' },
    { value: 'S7-400', label: 'Siemens S7-400 (S7-416, etc.)' },
    { value: 'S7-1200', label: 'Siemens S7-1200' },
    { value: 'S7-1500', label: 'Siemens S7-1500' },
  ];

  const tagTypes = [
    { value: 'running', label: 'Running Status' },
    { value: 'trip', label: 'Trip/Fault Status' },
    { value: 'off', label: 'Off/Stopped Status' },
    { value: 'custom', label: 'Custom Tag' },
  ];

  const tagExamples = {
    'Data Block Bit': 'DB1.DBX0.0 (Data Block 1, Byte 0, Bit 0)',
    'Data Block Word': 'DB1.DBW2 (Data Block 1, Word at byte 2)',
    'Memory Bit': 'M0.0 (Memory bit 0.0)',
    'Input Bit': 'I0.0 (Input bit 0.0)',
    'Output Bit': 'Q0.0 (Output bit 0.0)',
  };

  const rackSlotExamples = {
    'S7-300': { rack: 0, slot: 2 },
    'S7-400': { rack: 0, slot: 3 },
    'S7-1200': { rack: 0, slot: 1 },
    'S7-1500': { rack: 0, slot: 1 },
  };

  useEffect(() => {
    fetchConnections();
    fetchAssets();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<S7Connection[]>(
        `${import.meta.env.VITE_API_URL}/api/s7/connections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConnections(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching S7 connections:', err);
      setError('Failed to load S7 connections');
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Asset[]>(
        `${import.meta.env.VITE_API_URL}/api/assets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllAssets(response.data);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
    }
  };

  const fetchTags = async (connectionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<S7Tag[]>(
        `${import.meta.env.VITE_API_URL}/api/s7/connections/${connectionId}/tags`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTags(response.data);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      setError('Failed to load tags');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (selectedConnection) {
        // Update existing connection
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/s7/connections/${selectedConnection.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('S7 connection updated successfully');
      } else {
        // Create new connection
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/s7/connections`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('S7 connection created successfully');
      }
      fetchConnections();
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving S7 connection:', err);
      setError(err.response?.data?.error || 'Failed to save S7 connection');
    }
  };

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedConnection) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/s7/tags`,
        {
          ...tagFormData,
          s7_connection_id: selectedConnection.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Tag created successfully');
      fetchTags(selectedConnection.id);
      resetTagForm();
      setIsTagModalOpen(false);
    } catch (err: any) {
      console.error('Error creating tag:', err);
      setError(err.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this S7 connection?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/s7/connections/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('S7 connection deleted successfully');
      fetchConnections();
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      setError('Failed to delete connection');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/s7/tags/${tagId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Tag deleted successfully');
      if (selectedConnection) {
        fetchTags(selectedConnection.id);
      }
    } catch (err: any) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag');
    }
  };

  const openEditModal = (connection: S7Connection) => {
    setSelectedConnection(connection);
    setFormData({
      name: connection.name,
      plc_type: connection.plc_type,
      ip_address: connection.ip_address,
      rack: connection.rack,
      slot: connection.slot,
      enabled: connection.enabled,
      polling_interval: connection.polling_interval,
      connection_timeout: connection.connection_timeout,
      notes: connection.notes || '',
    });
    setIsModalOpen(true);
  };

  const openTagModal = (connection: S7Connection) => {
    setSelectedConnection(connection);
    fetchTags(connection.id);
    setIsTagModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      plc_type: 'S7-300',
      ip_address: '',
      rack: 0,
      slot: 2,
      enabled: true,
      polling_interval: 5000,
      connection_timeout: 10000,
      notes: '',
    });
    setSelectedConnection(null);
  };

  const resetTagForm = () => {
    setTagFormData({
      asset_id: '',
      tag_type: 'running',
      tag_name: '',
      tag_address: '',
      data_type: 'boolean',
      invert_logic: false,
      description: '',
    });
  };

  const handlePlcTypeChange = (plcType: string) => {
    const example = rackSlotExamples[plcType as keyof typeof rackSlotExamples];
    if (example) {
      setFormData({
        ...formData,
        plc_type: plcType,
        rack: example.rack,
        slot: example.slot,
      });
    } else {
      setFormData({ ...formData, plc_type: plcType });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">S7 PLC Configuration</h1>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: themeColors.primary, color: 'white' }}
        >
          + Add S7 Connection
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: themeColors.cardBg }}>
        <table className="min-w-full divide-y" style={{ borderColor: themeColors.border }}>
          <thead style={{ backgroundColor: themeColors.tableHeader }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">PLC Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rack/Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Assets</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
            {connections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No S7 connections configured. Click "Add S7 Connection" to get started.
                </td>
              </tr>
            ) : (
              connections.map((connection) => (
                <tr key={connection.id} className="hover:bg-gray-50" style={{ backgroundColor: themeColors.cardBg }}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{connection.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{connection.plc_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{connection.ip_address}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Rack {connection.rack}, Slot {connection.slot}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        connection.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {connection.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{connection.connected_assets || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openTagModal(connection)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Tags
                    </button>
                    <button
                      onClick={() => openEditModal(connection)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Connection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedConnection ? 'Edit S7 Connection' : 'Add S7 Connection'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Connection Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
              placeholder="e.g., S7-416 Production PLC"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">PLC Type *</label>
            <select
              value={formData.plc_type}
              onChange={(e) => handlePlcTypeChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
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
            <label className="block text-sm font-medium mb-1">IP Address *</label>
            <input
              type="text"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
              placeholder="192.168.10.10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rack *</label>
              <input
                type="number"
                value={formData.rack}
                onChange={(e) => setFormData({ ...formData, rack: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                min="0"
                max="7"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slot *</label>
              <input
                type="number"
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                min="0"
                max="31"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Polling Interval (ms)</label>
              <input
                type="number"
                value={formData.polling_interval}
                onChange={(e) => setFormData({ ...formData, polling_interval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Connection Timeout (ms)</label>
              <input
                type="number"
                value={formData.connection_timeout}
                onChange={(e) => setFormData({ ...formData, connection_timeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                min="1000"
                step="1000"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Enable this connection</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
              rows={3}
              placeholder="Optional notes about this PLC"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-900 mb-1">Typical Rack/Slot Values:</p>
            <ul className="text-blue-800 space-y-1">
              <li>• S7-300: Rack 0, Slot 2</li>
              <li>• S7-400: Rack 0, Slot 3</li>
              <li>• S7-1200/1500: Rack 0, Slot 1</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              style={{ borderColor: themeColors.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: themeColors.primary, color: 'white' }}
            >
              {selectedConnection ? 'Update Connection' : 'Create Connection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Tags Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setSelectedConnection(null);
          resetTagForm();
        }}
        title={`Tag Mappings - ${selectedConnection?.name}`}
        size="large"
      >
        <div className="space-y-6">
          {/* Add Tag Form */}
          <div className="border-b pb-4" style={{ borderColor: themeColors.border }}>
            <h3 className="text-lg font-semibold mb-3">Add New Tag</h3>
            <form onSubmit={handleTagSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Asset *</label>
                  <select
                    value={tagFormData.asset_id}
                    onChange={(e) => setTagFormData({ ...tagFormData, asset_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                    required
                  >
                    <option value="">Select Asset</option>
                    {allAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.asset_tag})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tag Type *</label>
                  <select
                    value={tagFormData.tag_type}
                    onChange={(e) => setTagFormData({ ...tagFormData, tag_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                    required
                  >
                    {tagTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tag Name *</label>
                  <input
                    type="text"
                    value={tagFormData.tag_name}
                    onChange={(e) => setTagFormData({ ...tagFormData, tag_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                    placeholder="Motor_1_Running"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tag Address *{' '}
                    <button
                      type="button"
                      onClick={() => setShowExamples(!showExamples)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      (examples)
                    </button>
                  </label>
                  <input
                    type="text"
                    value={tagFormData.tag_address}
                    onChange={(e) => setTagFormData({ ...tagFormData, tag_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.inputBg }}
                    placeholder="DB1.DBX0.0"
                    required
                  />
                </div>
              </div>

              {showExamples && (
                <div className="bg-gray-50 border rounded-lg p-3 text-xs">
                  <p className="font-semibold mb-2">S7 Tag Address Examples:</p>
                  {Object.entries(tagExamples).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="font-medium">{key}:</span> <code className="bg-white px-2 py-1 rounded">{value}</code>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tagFormData.invert_logic}
                    onChange={(e) => setTagFormData({ ...tagFormData, invert_logic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Invert Logic (0=ON, 1=OFF)</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: themeColors.primary, color: 'white' }}
                >
                  Add Tag
                </button>
              </div>
            </form>
          </div>

          {/* Existing Tags List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Configured Tags</h3>
            {tags.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tags configured yet</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    style={{ borderColor: themeColors.border, backgroundColor: themeColors.cardBg }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{tag.asset_name}</div>
                      <div className="text-sm text-gray-600">
                        {tag.tag_type} • <code className="bg-gray-100 px-2 py-1 rounded">{tag.tag_address}</code>
                        {tag.invert_logic && <span className="ml-2 text-xs">(inverted)</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
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

export default S7Configuration;
