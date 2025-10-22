import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

interface InventoryItem {
  id: number;
  part_number: string;
  name: string;
  category: string;
  description: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustingItemId, setAdjustingItemId] = useState<number | null>(null);
  const [adjustStockData, setAdjustStockData] = useState({
    quantity: '',
    adjustment_type: 'add',
    notes: '',
  });
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    category: '',
    quantity: '0',
    min_quantity: '0',
    unit: '',
    unit_cost: '',
    location: '',
    supplier: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        min_quantity: parseInt(formData.min_quantity),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
      };

      if (isEditMode && editingId) {
        await axios.put(`/api/inventory/${editingId}`, payload);
        setSuccess('Inventory item updated successfully!');
      } else {
        await axios.post('/api/inventory', payload);
        setSuccess('Inventory item created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({
        part_number: '',
        name: '',
        description: '',
        category: '',
        quantity: '0',
        min_quantity: '0',
        unit: '',
        unit_cost: '',
        location: '',
        supplier: '',
        notes: '',
      });
      fetchInventory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} inventory item`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = async (item: InventoryItem) => {
    try {
      const response = await axios.get(`/api/inventory/${item.id}`);
      const itemData = response.data;
      setFormData({
        part_number: itemData.part_number || '',
        name: itemData.name || '',
        description: itemData.description || '',
        category: itemData.category || '',
        quantity: itemData.quantity?.toString() || '0',
        min_quantity: itemData.min_quantity?.toString() || '0',
        unit: itemData.unit || '',
        unit_cost: itemData.unit_cost?.toString() || '',
        location: itemData.location || '',
        supplier: itemData.supplier || '',
        notes: itemData.notes || '',
      });
      setEditingId(item.id);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      setError('Failed to load inventory item details');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/inventory/${id}`);
      setSuccess('Inventory item deleted successfully!');
      setDeleteConfirm(null);
      fetchInventory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete inventory item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItemId) return;

    try {
      await axios.post(`/api/inventory/${adjustingItemId}/adjust`, {
        quantity: parseInt(adjustStockData.quantity),
        adjustment_type: adjustStockData.adjustment_type,
        notes: adjustStockData.notes,
      });
      setSuccess('Stock adjusted successfully!');
      setIsAdjustStockOpen(false);
      setAdjustingItemId(null);
      setAdjustStockData({
        quantity: '',
        adjustment_type: 'add',
        notes: '',
      });
      fetchInventory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      part_number: '',
      name: '',
      description: '',
      category: '',
      quantity: '0',
      min_quantity: '0',
      unit: '',
      unit_cost: '',
      location: '',
      supplier: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openAdjustStock = (item: InventoryItem) => {
    setAdjustingItemId(item.id);
    setAdjustStockData({
      quantity: '',
      adjustment_type: 'add',
      notes: '',
    });
    setIsAdjustStockOpen(true);
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
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Item
          </button>
        </div>
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
                  {deleteConfirm === item.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(item.id)}
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
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => openAdjustStock(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  )}
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

      {/* Add/Edit Inventory Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setEditingId(null);
        }}
        title={isEditMode ? "Edit Inventory Item" : "Add Inventory Item"}
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
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleChange}
                className="input"
                required
                placeholder="e.g., FLT-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder="Item name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Filters, Bearings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="input"
                placeholder="e.g., pieces, liters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="input"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Quantity</label>
              <input
                type="number"
                name="min_quantity"
                value={formData.min_quantity}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleChange}
                className="input"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input"
                placeholder="Storage location"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="input"
                placeholder="Supplier name"
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
              placeholder="Item description"
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
              {isEditMode ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustStockOpen}
        onClose={() => {
          setIsAdjustStockOpen(false);
          setAdjustingItemId(null);
        }}
        title="Adjust Stock"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjustment Type <span className="text-red-500">*</span>
            </label>
            <select
              name="adjustment_type"
              value={adjustStockData.adjustment_type}
              onChange={(e) => setAdjustStockData({ ...adjustStockData, adjustment_type: e.target.value })}
              className="input"
              required
            >
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
              <option value="set">Set Stock Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={adjustStockData.quantity}
              onChange={(e) => setAdjustStockData({ ...adjustStockData, quantity: e.target.value })}
              className="input"
              required
              min="0"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={adjustStockData.notes}
              onChange={(e) => setAdjustStockData({ ...adjustStockData, notes: e.target.value })}
              rows={3}
              className="input"
              placeholder="Reason for adjustment (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAdjustStockOpen(false);
                setAdjustingItemId(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Adjust Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
