import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

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

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const WorkOrders = () => {
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

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'completed') {
        payload.completed_date = new Date().toISOString();
      }
      await axios.put(`/api/work-orders/${id}`, payload);
      setSuccess(`Work order marked as ${newStatus}!`);
      fetchWorkOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update status');
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
        <button onClick={openAddModal} className="btn btn-primary">
          + New Work Order
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="input"
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
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workOrders.map((wo) => (
              <tr key={wo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{wo.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{wo.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wo.asset_name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{wo.work_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${priorityColors[wo.priority]}`}>
                    {wo.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${statusColors[wo.status]}`}>
                    {wo.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {wo.assigned_to_name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {deleteConfirm === wo.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(wo.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(wo)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(wo.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                      {wo.status !== 'completed' && wo.status !== 'cancelled' && (
                        <div className="flex items-center space-x-2">
                          {wo.status !== 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(wo.id, 'in_progress')}
                              className="text-yellow-600 hover:text-yellow-900 text-xs"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(wo.id, 'completed')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No work orders found. Click "New Work Order" to create one.
          </div>
        )}
      </div>

      {/* Add/Edit Work Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setEditingId(null);
        }}
        title={isEditMode ? "Edit Work Order" : "Create New Work Order"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
              placeholder="Brief description of the work"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
              <select name="asset_id" value={formData.asset_id} onChange={handleChange} className="input">
                <option value="">No asset selected</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} className="input">
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Type <span className="text-red-500">*</span>
              </label>
              <select name="work_type" value={formData.work_type} onChange={handleChange} className="input" required>
                <option value="corrective">Corrective</option>
                <option value="preventive">Preventive</option>
                <option value="inspection">Inspection</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="input" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleChange}
                className="input"
                step="0.5"
                min="0"
                placeholder="Hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Detailed description of the work to be done"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="input"
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditMode(false);
                setEditingId(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? 'Update Work Order' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkOrders;
