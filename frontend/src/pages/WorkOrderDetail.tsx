import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const WorkOrderDetail = () => {
  const { id } = useParams();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const fetchWorkOrder = async () => {
    try {
      const response = await axios.get(`/api/work-orders/${id}`);
      setWorkOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch work order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!workOrder) {
    return <div>Work order not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/work-orders" className="text-primary-600 hover:text-primary-900">
          ← Back to Work Orders
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Work Order #{workOrder.id}</h1>
        <button className="btn btn-primary">Edit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="text-sm text-gray-900">{workOrder.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Asset</dt>
              <dd className="text-sm text-gray-900">{workOrder.asset_name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Work Type</dt>
              <dd className="text-sm text-gray-900 capitalize">{workOrder.work_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="text-sm text-gray-900 capitalize">{workOrder.priority}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 capitalize">{workOrder.status.replace('_', ' ')}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="text-sm text-gray-900">{workOrder.assigned_to_name || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Reported By</dt>
              <dd className="text-sm text-gray-900">{workOrder.reported_by_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estimated Hours</dt>
              <dd className="text-sm text-gray-900">{workOrder.estimated_hours || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Actual Hours</dt>
              <dd className="text-sm text-gray-900">{workOrder.actual_hours || '-'}</dd>
            </div>
          </dl>
        </div>

        {workOrder.description && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-sm text-gray-700">{workOrder.description}</p>
          </div>
        )}

        {workOrder.parts && workOrder.parts.length > 0 && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Parts Used</h2>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">Part Number</th>
                  <th className="text-left text-sm font-medium text-gray-500">Part Name</th>
                  <th className="text-left text-sm font-medium text-gray-500">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.parts.map((part: any) => (
                  <tr key={part.id}>
                    <td className="py-2 text-sm text-gray-900">{part.part_number}</td>
                    <td className="py-2 text-sm text-gray-900">{part.part_name}</td>
                    <td className="py-2 text-sm text-gray-900">{part.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrderDetail;
