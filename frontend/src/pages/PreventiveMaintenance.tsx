import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

interface PMSchedule {
  id: number;
  asset_name: string;
  title: string;
  frequency: string;
  frequency_value: number;
  next_due: string;
  last_completed: string;
  assigned_to_name: string;
  is_active: boolean;
}

const PreventiveMaintenance = () => {
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
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
        <button className="btn btn-primary">+ New Schedule</button>
      </div>

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
    </div>
  );
};

export default PreventiveMaintenance;
