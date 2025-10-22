import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import Modal from '../components/Modal';

interface PMSchedule {
  id: number;
  asset_id: number;
  asset_name: string;
  title: string;
  description: string;
  frequency: string;
  frequency_value: number;
  next_due: string;
  last_completed: string;
  assigned_to_name: string;
  assigned_to: number;
  is_active: boolean;
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

const PreventiveMaintenance = () => {
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    title: '',
    description: '',
    frequency: 'monthly',
    frequency_value: '1',
    next_due: '',
    assigned_to: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSchedules();
    fetchAssets();
    fetchUsers();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('/api/preventive-maintenance');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch PM schedules:', error);
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
        asset_id: parseInt(formData.asset_id),
        title: formData.title,
        description: formData.description,
        frequency: formData.frequency,
        frequency_value: parseInt(formData.frequency_value),
        next_due: formData.next_due,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
      };

      await axios.post('/api/preventive-maintenance', payload);
      setSuccess('PM schedule created successfully!');
      setIsModalOpen(false);
      setFormData({
        asset_id: '',
        title: '',
        description: '',
        frequency: 'monthly',
        frequency_value: '1',
        next_due: '',
        assigned_to: '',
      });
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create PM schedule');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const completeTask = async (id: number) => {
    if (!confirm('Mark this preventive maintenance task as complete?')) return;

    try {
      await axios.post(`/api/preventive-maintenance/${id}/complete`);
      fetchSchedules();
    } catch (error) {
      console.error('Failed to complete PM task:', error);
      alert('Failed to complete task');
    }
  };

  const isOverdue = (nextDue: string) => {
    return new Date(nextDue) < new Date();
  };

  const isDueSoon = (nextDue: string) => {
    const due = new Date(nextDue);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= weekFromNow;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Preventive Maintenance</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">+ New Schedule</button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Completed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr
                key={schedule.id}
                className={`hover:bg-gray-50 ${
                  isOverdue(schedule.next_due) ? 'bg-red-50' : isDueSoon(schedule.next_due) ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.asset_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{schedule.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  Every {schedule.frequency_value} {schedule.frequency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={
                      isOverdue(schedule.next_due)
                        ? 'text-red-600 font-semibold'
                        : isDueSoon(schedule.next_due)
                        ? 'text-yellow-600 font-semibold'
                        : 'text-gray-900'
                    }
                  >
                    {format(new Date(schedule.next_due), 'MMM dd, yyyy')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.last_completed ? format(new Date(schedule.last_completed), 'MMM dd, yyyy') : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.assigned_to_name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {schedule.is_active ? (
                    <span className="badge bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-800">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => completeTask(schedule.id)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Complete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No PM schedules found. Click "New Schedule" to create one.
          </div>
        )}
      </div>

      {/* Add PM Schedule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create PM Schedule">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset <span className="text-red-500">*</span>
            </label>
            <select name="asset_id" value={formData.asset_id} onChange={handleChange} className="input" required>
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
              placeholder="e.g., Monthly Filter Replacement"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select name="frequency" value={formData.frequency} onChange={handleChange} className="input" required>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Every <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="frequency_value"
                value={formData.frequency_value}
                onChange={handleChange}
                className="input"
                required
                min="1"
                placeholder="e.g., 1, 2, 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., "2" with "Weekly" = Every 2 weeks
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="next_due"
              value={formData.next_due}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Detailed task description and instructions"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PreventiveMaintenance;
