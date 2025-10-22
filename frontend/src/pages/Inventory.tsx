import { useEffect, useState } from 'react';
import axios from 'axios';

interface InventoryItem {
  id: number;
  part_number: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  unit_cost: number;
  location: string;
  supplier: string;
}

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [showLowStock]);

  const fetchInventory = async () => {
    try {
      const url = showLowStock ? '/api/inventory/low-stock' : '/api/inventory';
      const response = await axios.get(url);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (item: InventoryItem) => {
    return item.quantity <= item.min_quantity;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`btn ${showLowStock ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showLowStock ? 'Show All' : 'Low Stock Only'}
          </button>
          <button className="btn btn-primary">+ Add Item</button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 ${isLowStock(item) ? 'bg-yellow-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.part_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={isLowStock(item) ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                    {item.quantity} {item.unit || 'units'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.min_quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.unit_cost?.toFixed(2) || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supplier || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-primary-600 hover:text-primary-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No inventory items found. Click "Add Item" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
