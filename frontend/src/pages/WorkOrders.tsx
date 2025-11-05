import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import ResponsiveTable from '../components/ResponsiveTable';
import { useTheme } from '../context/ThemeContext';
import { RESPONSIVE_TEXT, TOUCH_TARGET } from '../utils/responsive';

interface WorkOrder {
  id: number;
  title: string;
  asset_name: string;
  priority: string;
  status: string;
  work_type: string;
  assigned_to_name: string;
  created_at: string;
}

interface Asset {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  full_name: string;
}

const WorkOrders = () => {
  const { themeColors } = useTheme();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_id: '',
    priority: 'medium',
    status: 'open',
    work_type: 'corrective',
    assigned_to: '',
    estimated_hours: '',
    scheduled_date: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const priorityColors: Record<string, string> = {
    low: themeColors.colors.infoLight,
    medium: themeColors.colors.warningLight,
    high: 'bg-orange-100 text-orange-800',
    urgent: themeColors.colors.errorLight,
  };

  const statusColors: Record<string, string> = {
    open: themeColors.colors.infoLight,
    assigned: 'bg-purple-100 text-purple-800',
    in_progress: themeColors.colors.warningLight,
    on_hold: themeColors.colors.badgeRetired,
    completed: themeColors.colors.successLight,
    cancelled: themeColors.colors.errorLight,
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchAssets();
    fetchUsers();
  }, [filter]);

  const fetchWorkOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);

      const response = await axios.get(`/api/work-orders?${params.toString()}`);
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        asset_id: formData.asset_id ? parseInt(formData.asset_id) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      };

      if (isEditMode && editingId) {
        await axios.put(`/api/work-orders/${editingId}`, payload);
        setSuccess('Work order updated successfully!');
      } else {
        await axios.post('/api/work-orders', payload);
        setSuccess('Work order created successfully!');
      }

      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        asset_id: '',
        priority: 'medium',
        status: 'open',
        work_type: 'corrective',
        assigned_to: '',
        estimated_hours: '',
        scheduled_date: '',
        notes: '',
      });
      fetchWorkOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} work order`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = async (wo: WorkOrder) => {
    try {
      const response = await axios.get(`/api/work-orders/${wo.id}`);
      const woData = response.data;
      setFormData({
        title: woData.title || '',
        description: woData.description || '',
        asset_id: woData.asset_id?.toString() || '',
        priority: woData.priority || 'medium',
        status: woData.status || 'open',
        work_type: woData.work_type || 'corrective',
        assigned_to: woData.assigned_to?.toString() || '',
        estimated_hours: woData.estimated_hours?.toString() || '',
        scheduled_date: woData.scheduled_date || '',
        notes: woData.notes || '',
      });
      setEditingId(wo.id);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      setError('Failed to load work order details');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/work-orders/${id}`);
      setSuccess('Work order deleted successfully!');
      setDeleteConfirm(null);
      fetchWorkOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete work order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      asset_id: '',
      priority: 'medium',
      status: 'open',
      work_type: 'corrective',
      assigned_to: '',
      estimated_hours: '',
      scheduled_date: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className={themeColors.colors.textPrimary}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className={`${RESPONSIVE_TEXT.h2} font-bold ${themeColors.colors.textPrimary}`}>Work Orders</h1>
        <button onClick={openAddModal} className={`${themeColors.colors.primary} ${themeColors.colors.primaryHover} text-white px-4 ${TOUCH_TARGET.medium} rounded-lg font-medium transition-colors ${RESPONSIVE_TEXT.body}`}>
          + New Work Order
        </button>
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
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-2`}>Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className={`${themeColors.colors.card} ${themeColors.colors.cardBorder} border rounded-lg shadow-sm overflow-hidden`}>
        <ResponsiveTable
          columns={[
            {
              key: 'title',
              label: 'Title',
              render: (value: string) => (
                <div className="max-w-xs truncate">{value}</div>
              )
            },
            {
              key: 'asset_name',
              label: 'Asset',
              hideOnMobile: true,
              render: (value: string) => value || '-'
            },
            {
              key: 'priority',
              label: 'Priority',
              render: (value: string) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[value]}`}>
                  {value}
                </span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (value: string) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[value]}`}>
                  {value.replace('_', ' ')}
                </span>
              ),
            },
            {
              key: 'assigned_to_name',
              label: 'Assigned To',
              hideOnMobile: true,
              hideOnTablet: true,
              render: (value: string) => value || 'Unassigned'
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, wo: WorkOrder) => (
                deleteConfirm === wo.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(wo.id);
                      }}
                      className={`${themeColors.colors.errorText} font-medium ${TOUCH_TARGET.small} px-3`}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(null);
                      }}
                      className={`${themeColors.colors.textMuted} ${TOUCH_TARGET.small} px-3`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(wo);
                      }}
                      className={`${themeColors.colors.primaryText} ${TOUCH_TARGET.small} px-3`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(wo.id);
                      }}
                      className={`${themeColors.colors.errorText} ${TOUCH_TARGET.small} px-3`}
                    >
                      Delete
                    </button>
                  </div>
                )
              ),
            },
          ]}
          data={workOrders}
          keyField="id"
          emptyMessage="No work orders found. Click 'New Work Order' to create one."
        />
      </div>

      {/* Add/Edit Work Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setEditingId(null);
        }}
        title={isEditMode ? "Edit Work Order" : "New Work Order"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`${themeColors.colors.errorLight} border ${themeColors.colors.errorText} px-4 py-3 rounded-lg text-sm`}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Title <span className={themeColors.colors.errorText}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Description <span className={themeColors.colors.errorText}>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Asset</label>
              <select
                name="asset_id"
                value={formData.asset_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              >
                <option value="">Select Asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Work Type</label>
              <select
                name="work_type"
                value={formData.work_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              >
                <option value="corrective">Corrective</option>
                <option value="preventive">Preventive</option>
                <option value="inspection">Inspection</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>
                Priority <span className={themeColors.colors.errorText}>*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Assign To</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeColors.colors.textSecondary} mb-1`}>Scheduled Date</label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border ${themeColors.colors.input}`}
              />
            </div>

            <div className="sm:col-span-2">
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
              {isEditMode ? 'Update Work Order' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkOrders;
