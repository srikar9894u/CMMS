import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/Modal';

interface Connection {
  id: number;
  name: string;
  plc_type: string;
  server_url: string;
  connection_type: 'opc' | 's7';
}

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
}

interface Tag {
  id: number;
  connection_id: number;
  connection_name: string;
  connection_type: 'opc' | 's7';
  asset_id: number;
  asset_name: string;
  asset_tag: string;
  tag_type: string;
  tag_name: string;
  tag_address: string;
  data_type: string;
  invert_logic: boolean;
  description: string | null;
}

const TagsManagement = () => {
  const { themeColors } = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [filterConnection, setFilterConnection] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    connection_id: '',
    connection_type: 'opc' as 'opc' | 's7',
    asset_id: '',
    tag_type: 'running',
    tag_name: '',
    tag_address: '',
    data_type: 'boolean',
    invert_logic: false,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [opcConns, s7Conns, opcTags, s7Tags, assetsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/opc/connections'),
        axios.get('http://localhost:3000/api/s7/connections'),
        axios.get('http://localhost:3000/api/opc/tags'),
        axios.get('http://localhost:3000/api/s7/tags'),
        axios.get('http://localhost:3000/api/assets')
      ]);

      // Combine OPC and S7 connections
      const allConnections: Connection[] = [
        ...opcConns.data.map((c: any) => ({ ...c, connection_type: 'opc' as const })),
        ...s7Conns.data.map((c: any) => ({ ...c, connection_type: 's7' as const }))
      ];

      // Combine and normalize tags
      const allTags: Tag[] = [
        ...opcTags.data.map((t: any) => ({
          ...t,
          connection_id: t.opc_connection_id,
          connection_name: opcConns.data.find((c: any) => c.id === t.opc_connection_id)?.name || 'Unknown',
          connection_type: 'opc' as const
        })),
        ...s7Tags.data.map((t: any) => ({
          ...t,
          connection_id: t.s7_connection_id,
          connection_name: s7Conns.data.find((c: any) => c.id === t.s7_connection_id)?.name || 'Unknown',
          connection_type: 's7' as const
        }))
      ];

      setConnections(allConnections);
      setTags(allTags);
      setAssets(assetsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = formData.connection_type === 'opc' ? '/api/opc/tags' : '/api/s7/tags';
      const payload = {
        [`${formData.connection_type}_connection_id`]: parseInt(formData.connection_id),
        asset_id: parseInt(formData.asset_id),
        tag_type: formData.tag_type,
        tag_name: formData.tag_name,
        tag_address: formData.tag_address,
        data_type: formData.data_type,
        invert_logic: formData.invert_logic,
        description: formData.description
      };

      await axios.post(`http://localhost:3000${endpoint}`, payload);

      alert('Tag added successfully!');
      setShowAddModal(false);
      setFormData({
        connection_id: '',
        connection_type: 'opc',
        asset_id: '',
        tag_type: 'running',
        tag_name: '',
        tag_address: '',
        data_type: 'boolean',
        invert_logic: false,
        description: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      alert(error.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      connection_id: tag.connection_id.toString(),
      connection_type: tag.connection_type,
      asset_id: tag.asset_id.toString(),
      tag_type: tag.tag_type,
      tag_name: tag.tag_name,
      tag_address: tag.tag_address,
      data_type: tag.data_type,
      invert_logic: tag.invert_logic,
      description: tag.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTag) return;

    try {
      const endpoint = editingTag.connection_type === 'opc' ? '/api/opc/tags' : '/api/s7/tags';
      const payload = {
        tag_type: formData.tag_type,
        tag_name: formData.tag_name,
        tag_address: formData.tag_address,
        data_type: formData.data_type,
        invert_logic: formData.invert_logic,
        description: formData.description
      };

      await axios.put(`http://localhost:3000${endpoint}/${editingTag.id}`, payload);

      alert('Tag updated successfully!');
      setShowEditModal(false);
      setEditingTag(null);
      setFormData({
        connection_id: '',
        connection_type: 'opc',
        asset_id: '',
        tag_type: 'running',
        tag_name: '',
        tag_address: '',
        data_type: 'boolean',
        invert_logic: false,
        description: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to update tag:', error);
      alert(error.response?.data?.error || 'Failed to update tag');
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.tag_name}" for ${tag.asset_name}?`)) return;

    try {
      const endpoint = tag.connection_type === 'opc' ? '/api/opc/tags' : '/api/s7/tags';
      await axios.delete(`http://localhost:3000${endpoint}/${tag.id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  };

  // Apply filters
  const filteredTags = tags.filter(tag => {
    if (filterConnection && tag.connection_id !== parseInt(filterConnection)) return false;
    if (filterAsset && tag.asset_id !== parseInt(filterAsset)) return false;
    if (filterType && tag.tag_type !== filterType) return false;
    return true;
  });

  // Group tags by asset
  const tagsByAsset = filteredTags.reduce((acc, tag) => {
    const key = `${tag.asset_id}-${tag.asset_name}`;
    if (!acc[key]) {
      acc[key] = {
        asset_id: tag.asset_id,
        asset_name: tag.asset_name,
        asset_tag: tag.asset_tag,
        tags: []
      };
    }
    acc[key].tags.push(tag);
    return acc;
  }, {} as Record<string, { asset_id: number; asset_name: string; asset_tag: string; tags: Tag[] }>);

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>
            Tags Management
          </h1>
          <p className={`text-sm ${themeColors.colors.textMuted} mt-1`}>
            Centralized view of all PLC tags across OPC UA and S7 connections
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
        >
          + Add Tag
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Total Tags</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>{tags.length}</div>
        </div>
        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>OPC Tags</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {tags.filter(t => t.connection_type === 'opc').length}
          </div>
        </div>
        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>S7 Tags</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {tags.filter(t => t.connection_type === 's7').length}
          </div>
        </div>
        <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder}`}>
          <div className={`text-sm ${themeColors.colors.textMuted}`}>Assets Monitored</div>
          <div className={`text-2xl font-bold ${themeColors.colors.textPrimary} mt-1`}>
            {new Set(tags.map(t => t.asset_id)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${themeColors.colors.card} p-4 rounded-lg border ${themeColors.colors.cardBorder} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Filter by Connection
            </label>
            <select
              value={filterConnection}
              onChange={(e) => setFilterConnection(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">All Connections</option>
              {connections.map(conn => (
                <option key={`${conn.connection_type}-${conn.id}`} value={conn.id}>
                  [{conn.connection_type.toUpperCase()}] {conn.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Filter by Asset
            </label>
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">All Assets</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_tag})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Filter by Tag Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">All Types</option>
              <option value="running">Running Status</option>
              <option value="trip">Trip/Fault Status</option>
              <option value="off">Off/Stopped Status</option>
              <option value="custom">Custom Tag</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tags grouped by Asset */}
      <div className="space-y-4">
        {Object.values(tagsByAsset).length === 0 ? (
          <div className={`${themeColors.colors.card} p-8 rounded-lg border ${themeColors.colors.cardBorder} text-center`}>
            <p className={`${themeColors.colors.textMuted}`}>
              No tags found. {filterConnection || filterAsset || filterType ? 'Try adjusting filters.' : 'Add tags to start monitoring assets.'}
            </p>
          </div>
        ) : (
          Object.values(tagsByAsset).map(assetGroup => (
            <div key={assetGroup.asset_id} className={`${themeColors.colors.card} rounded-lg border ${themeColors.colors.cardBorder} overflow-hidden`}>
              <div className={`${themeColors.colors.secondary} px-4 py-3 border-b ${themeColors.colors.cardBorder}`}>
                <h3 className={`font-semibold ${themeColors.colors.textPrimary}`}>
                  {assetGroup.asset_name}
                  <span className={`ml-2 text-sm ${themeColors.colors.textMuted}`}>
                    ({assetGroup.asset_tag})
                  </span>
                  <span className={`ml-3 px-2 py-1 text-xs rounded ${themeColors.colors.primary} text-white`}>
                    {assetGroup.tags.length} tags
                  </span>
                </h3>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {assetGroup.tags.map(tag => (
                    <div key={tag.id} className={`${themeColors.colors.secondary} p-3 rounded-lg`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            tag.connection_type === 'opc'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {tag.connection_type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`}>
                            {tag.tag_type}
                          </span>
                          {tag.invert_logic && (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              INVERTED
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(tag)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Edit tag"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(tag)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Delete tag"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div>
                          <span className={`text-xs ${themeColors.colors.textMuted}`}>Connection: </span>
                          <span className={`text-sm font-medium ${themeColors.colors.textPrimary}`}>{tag.connection_name}</span>
                        </div>
                        <div>
                          <span className={`text-xs ${themeColors.colors.textMuted}`}>Tag Name: </span>
                          <span className={`text-sm font-medium ${themeColors.colors.textPrimary}`}>{tag.tag_name}</span>
                        </div>
                        <div>
                          <span className={`text-xs ${themeColors.colors.textMuted}`}>Address: </span>
                          <code className={`text-xs ${themeColors.colors.textMuted} bg-black bg-opacity-10 px-1 rounded`}>
                            {tag.tag_address}
                          </code>
                        </div>
                        {tag.description && (
                          <div>
                            <span className={`text-xs ${themeColors.colors.textMuted}`}>{tag.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Tag Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingTag(null); }} title="Edit Tag">
        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Connection Info - Read-only */}
          <div className={`${themeColors.colors.secondary} p-3 rounded-lg`}>
            <div className="space-y-1">
              <div>
                <span className={`text-xs ${themeColors.colors.textMuted}`}>Connection: </span>
                <span className={`text-sm font-medium ${themeColors.colors.textPrimary}`}>{editingTag?.connection_name}</span>
              </div>
              <div>
                <span className={`text-xs ${themeColors.colors.textMuted}`}>Asset: </span>
                <span className={`text-sm font-medium ${themeColors.colors.textPrimary}`}>{editingTag?.asset_name}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                Tag Type *
              </label>
              <select
                value={formData.tag_type}
                onChange={(e) => setFormData({ ...formData, tag_type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              >
                <option value="running">Running Status</option>
                <option value="trip">Trip/Fault Status</option>
                <option value="off">Off/Stopped Status</option>
                <option value="custom">Custom Tag</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                Tag Name *
              </label>
              <input
                type="text"
                value={formData.tag_name}
                onChange={(e) => setFormData({ ...formData, tag_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                placeholder="Motor_Running"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Tag Address *
            </label>
            <input
              type="text"
              value={formData.tag_address}
              onChange={(e) => setFormData({ ...formData, tag_address: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder={formData.connection_type === 'opc' ? 'ns=3;s="DB1"."Running"' : 'DB1.DBX0.0'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                Data Type
              </label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              >
                <option value="boolean">Boolean</option>
                <option value="integer">Integer</option>
                <option value="float">Float</option>
                <option value="string">String</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="edit_invert_logic"
                checked={formData.invert_logic}
                onChange={(e) => setFormData({ ...formData, invert_logic: e.target.checked })}
                className="mr-2 w-4 h-4"
              />
              <label htmlFor="edit_invert_logic" className={`text-sm ${themeColors.colors.textSecondary}`}>
                Invert Logic (0=ON, 1=OFF)
              </label>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="Main motor running status"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowEditModal(false); setEditingTag(null); }}
              className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Update Tag
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Tag Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Tag">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Connection Type *
            </label>
            <select
              value={formData.connection_type}
              onChange={(e) => setFormData({ ...formData, connection_type: e.target.value as 'opc' | 's7', connection_id: '' })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              required
            >
              <option value="opc">OPC UA</option>
              <option value="s7">S7 PLC</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Connection *
            </label>
            <select
              value={formData.connection_id}
              onChange={(e) => setFormData({ ...formData, connection_id: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              required
            >
              <option value="">Select Connection</option>
              {connections
                .filter(c => c.connection_type === formData.connection_type)
                .map(conn => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
            </select>
          </div>

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
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_tag})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                Tag Type *
              </label>
              <select
                value={formData.tag_type}
                onChange={(e) => setFormData({ ...formData, tag_type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              >
                <option value="running">Running Status</option>
                <option value="trip">Trip/Fault Status</option>
                <option value="off">Off/Stopped Status</option>
                <option value="custom">Custom Tag</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                Tag Name *
              </label>
              <input
                type="text"
                value={formData.tag_name}
                onChange={(e) => setFormData({ ...formData, tag_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                placeholder="Motor_Running"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Tag Address *
            </label>
            <input
              type="text"
              value={formData.tag_address}
              onChange={(e) => setFormData({ ...formData, tag_address: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder={formData.connection_type === 'opc' ? 'ns=3;s="DB1"."Running"' : 'DB1.DBX0.0'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
                Data Type
              </label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              >
                <option value="boolean">Boolean</option>
                <option value="integer">Integer</option>
                <option value="float">Float</option>
                <option value="string">String</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="add_invert_logic"
                checked={formData.invert_logic}
                onChange={(e) => setFormData({ ...formData, invert_logic: e.target.checked })}
                className="mr-2 w-4 h-4"
              />
              <label htmlFor="add_invert_logic" className={`text-sm ${themeColors.colors.textSecondary}`}>
                Invert Logic (0=ON, 1=OFF)
              </label>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="Main motor running status"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Add Tag
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TagsManagement;
