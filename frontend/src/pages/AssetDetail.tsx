import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface Asset {
  id: number;
  name: string;
  asset_tag: string;
  category: string;
  location: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  warranty_expiry: string;
  status: string;
  criticality: string;
  description: string;
  notes: string;
}

const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const response = await axios.get(`/api/assets/${id}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Failed to fetch asset:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!asset) {
    return <div>Asset not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/assets" className="text-primary-600 hover:text-primary-900">
          ← Back to Assets
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
        <button className="btn btn-primary">Edit Asset</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Asset Tag</dt>
              <dd className="text-sm text-gray-900">{asset.asset_tag}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900">{asset.category}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-sm text-gray-900">{asset.location || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 capitalize">{asset.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Criticality</dt>
              <dd className="text-sm text-gray-900 capitalize">{asset.criticality || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
              <dd className="text-sm text-gray-900">{asset.manufacturer || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="text-sm text-gray-900">{asset.model || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
              <dd className="text-sm text-gray-900">{asset.serial_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
              <dd className="text-sm text-gray-900">{asset.purchase_date || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Warranty Expiry</dt>
              <dd className="text-sm text-gray-900">{asset.warranty_expiry || '-'}</dd>
            </div>
          </dl>
        </div>

        {asset.description && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-sm text-gray-700">{asset.description}</p>
          </div>
        )}

        {asset.notes && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700">{asset.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetail;
