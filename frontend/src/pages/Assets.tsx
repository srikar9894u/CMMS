import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  location: string;
  status: string;
  criticality: string;
}

const statusColors: Record<string, string> = {
  operational: 'bg-green-100 text-green-800',
  down: 'bg-red-100 text-red-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
};

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '' });

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <button className="btn btn-primary">+ Add Asset</button>
      </div>

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
              <option value="operational">Operational</option>
              <option value="down">Down</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              placeholder="Filter by category"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criticality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {asset.asset_tag}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${statusColors[asset.status]}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {asset.criticality || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link to={`/assets/${asset.id}`} className="text-primary-600 hover:text-primary-900">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No assets found. Click "Add Asset" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default Assets;
