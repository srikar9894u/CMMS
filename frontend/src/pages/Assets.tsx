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
  status: string;
  criticality: string;
}

const Assets = () => {
  const { themeColors } = useTheme();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    category: '',
    location: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    status: 'operational',
    criticality: 'medium',
    description: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [filter]);

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const response = await axios.get(`/api/assets?${params.toString()}`);
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isEditMode && editingId) {
        await axios.put(`/api/assets/${editingId}`, formData);
        setSuccess('Asset updated successfully!');
      } else {
        await axios.post('/api/assets', formData);
        setSuccess('Asset created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({
        name: '',
        asset_tag: '',
        category: '',
        location: '',
        manufacturer: '',
        model: '',
        serial_number: '',
        purchase_date: '',
        warranty_expiry: '',
        status: 'operational',
        criticality: 'medium',
        description: '',
        notes: '',
      });
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} asset`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = async (asset: Asset) => {
    try {
      const response = await axios.get(`/api/assets/${asset.id}`);
      const assetData = response.data;
      setFormData({
        name: assetData.name || '',
        asset_tag: assetData.asset_tag || '',
        category: assetData.category || '',
        location: assetData.location || '',
        manufacturer: assetData.manufacturer || '',
        model: assetData.model || '',
        serial_number: assetData.serial_number || '',
        purchase_date: assetData.purchase_date || '',
        warranty_expiry: assetData.warranty_expiry || '',
        status: assetData.status || 'operational',
        criticality: assetData.criticality || 'medium',
        description: assetData.description || '',
        notes: assetData.notes || '',
      });
      setEditingId(asset.id);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      setError('Failed to load asset details');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/assets/${id}`);
      setSuccess('Asset deleted successfully!');
      setDeleteConfirm(null);
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete asset');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      asset_tag: '',
      category: '',
      location: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      status: 'operational',
      criticality: 'medium',
      description: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const statusColors: Record<string, string> = {
    operational: themeColors.colors.badgeOperational,
    down: themeColors.colors.badgeDown,
    maintenance: themeColors.colors.badgeMaintenance,
    retired: themeColors.colors.badgeRetired,
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${themeColors.colors.textPrimary}`}>Assets</h1>
        <button onClick={openAddModal} className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}>
          + Add Asset
        </button>
      </div>

      {success && (
        <div className={`mb-4 ${themeColors.colors.successLight} border ${themeColors.colors.successText} px-4 py-3 rounded-lg text-sm`}>
          {success}
        </div>
      )}

      {/* Filters */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">All Statuses</option>
              <option value="operational">Operational</option>
              <option value="down">Down</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>Category</label>
            <input
              type="text"
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              placeholder="Filter by category"
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            />
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${themeColors.colors.borderLight}`}>
            <thead className={`${themeColors.colors.secondary}`}>
              <tr>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>Asset Tag</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>Name</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden md:table-cell`}>Category</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden lg:table-cell`}>Location</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>Status</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase hidden xl:table-cell`}>Criticality</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium ${themeColors.colors.textMuted} uppercase`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${themeColors.colors.card} divide-y ${themeColors.colors.borderLight}`}>
              {assets.map((asset) => (
                <tr key={asset.id} className={themeColors.colors.cardHover}>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${themeColors.colors.textPrimary}`}>
                    {asset.asset_tag}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textPrimary}`}>{asset.name}</td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textMuted} hidden md:table-cell`}>{asset.category}</td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textMuted} hidden lg:table-cell`}>{asset.location || '-'}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[asset.status]}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${themeColors.colors.textMuted} capitalize hidden xl:table-cell`}>
                    {asset.criticality || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    {deleteConfirm === asset.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className={`${themeColors.colors.errorText} font-medium`}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className={themeColors.colors.textMuted}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(asset)}
                          className={themeColors.colors.primaryText}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(asset.id)}
                          className={themeColors.colors.errorText}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assets.length === 0 && (
          <div className={`text-center py-12 ${themeColors.colors.textMuted}`}>
            No assets found. Click "Add Asset" to create one.
          </div>
        )}
      </div>

      {/* Add/Edit Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setEditingId(null);
        }}
        title={isEditMode ? "Edit Asset" : "Add New Asset"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`${themeColors.colors.errorLight} border ${themeColors.colors.errorText} px-4 py-3 rounded-lg text-sm`}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Name <span className={themeColors.colors.errorText}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Asset Tag <span className={themeColors.colors.errorText}>*</span>
              </label>
              <input
                type="text"
                name="asset_tag"
                value={formData.asset_tag}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Category <span className={themeColors.colors.errorText}>*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                placeholder="e.g., HVAC, Electrical"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                placeholder="e.g., Building A - Floor 2"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Serial Number</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Status <span className={themeColors.colors.errorText}>*</span>
              </label>
              <select name="status" value={formData.status} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`} required>
                <option value="operational">Operational</option>
                <option value="down">Down</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Criticality</label>
              <select name="criticality" value={formData.criticality} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Purchase Date</label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Warranty Expiry</label>
              <input
                type="date"
                name="warranty_expiry"
                value={formData.warranty_expiry}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="Brief description of the asset"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              placeholder="Additional notes"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditMode(false);
                setEditingId(null);
              }}
              className={`${themeColors.colors.secondary} ${themeColors.colors.secondaryHover} ${themeColors.colors.secondaryText} px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button type="submit" className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 py-2 rounded-lg font-medium transition-colors`}>
              {isEditMode ? 'Update Asset' : 'Create Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Assets;
