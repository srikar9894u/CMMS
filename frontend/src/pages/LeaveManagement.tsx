import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Modal from '../components/Modal';

interface LeaveRequest {
  id: number;
  user_id: number;
  user_name: string;
  username: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
  reason: string;
  approved_by_name?: string;
  notes?: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const typeColors: Record<string, string> = {
  vacation: 'bg-blue-100 text-blue-800',
  sick: 'bg-purple-100 text-purple-800',
  personal: 'bg-gray-100 text-gray-800',
  other: 'bg-orange-100 text-orange-800',
};

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ id: number; action: 'approved' | 'rejected' } | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'vacation',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchLeaves();
    fetchUserRole();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/api/leave');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      }
    } catch (error) {
      console.error('Failed to get user role:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/leave', formData);
      setSuccess('Leave request submitted successfully!');
      setIsModalOpen(false);
      setFormData({
        start_date: '',
        end_date: '',
        leave_type: 'vacation',
        reason: '',
      });
      fetchLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create leave request');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/leave/${id}`);
      setSuccess('Leave request deleted successfully!');
      setDeleteConfirm(null);
      fetchLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete leave request');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleApproval = async () => {
    if (!approvalModal) return;

    try {
      await axios.put(`/api/leave/${approvalModal.id}/status`, {
        status: approvalModal.action,
        notes: approvalNotes,
      });
      setSuccess(`Leave request ${approvalModal.action} successfully!`);
      setApprovalModal(null);
      setApprovalNotes('');
      fetchLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update leave status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openAddModal = () => {
    setFormData({
      start_date: '',
      end_date: '',
      leave_type: 'vacation',
      reason: '',
    });
    setIsModalOpen(true);
  };

  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <button onClick={openAddModal} className="btn btn-primary">
          + Request Leave
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isManagerOrAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaves.map((leave) => {
              const startDate = new Date(leave.start_date);
              const endDate = new Date(leave.end_date);
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              return (
                <tr key={leave.id} className="hover:bg-gray-50">
                  {isManagerOrAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {leave.user_name || leave.username}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${typeColors[leave.leave_type]}`}>
                      {leave.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(startDate, 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(endDate, 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {days} {days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${statusColors[leave.status]}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {leave.reason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {deleteConfirm === leave.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(leave.id)}
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
                        {isManagerOrAdmin && leave.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setApprovalModal({ id: leave.id, action: 'approved' })}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setApprovalModal({ id: leave.id, action: 'rejected' })}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {(leave.status === 'pending' || isManagerOrAdmin) && (
                          <button
                            onClick={() => setDeleteConfirm(leave.id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leaves.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No leave requests found. Click "Request Leave" to create one.
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Leave"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              name="leave_type"
              value={formData.leave_type}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Optional: Provide a reason for your leave request"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={!!approvalModal}
        onClose={() => {
          setApprovalModal(null);
          setApprovalNotes('');
        }}
        title={`${approvalModal?.action === 'approved' ? 'Approve' : 'Reject'} Leave Request`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              className="input"
              placeholder="Add notes about this decision"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setApprovalModal(null);
                setApprovalNotes('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleApproval}
              className={`btn ${approvalModal?.action === 'approved' ? 'btn-primary' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {approvalModal?.action === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
