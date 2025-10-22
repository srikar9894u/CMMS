import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all inventory items
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { category, low_stock } = req.query;
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (low_stock === 'true') {
      query += ' AND quantity <= min_quantity';
    }

    query += ' ORDER BY name ASC';

    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock items
router.get('/low-stock', (req: AuthRequest, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM inventory WHERE quantity <= min_quantity ORDER BY quantity ASC').all();
    res.json(items);
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory item by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory item (admin/manager only)
router.post(
  '/',
  roleMiddleware('admin', 'manager'),
  [
    body('part_number').notEmpty().withMessage('Part number is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      part_number, name, description, category, quantity,
      min_quantity, unit, unit_cost, location, supplier, notes
    } = req.body;

    try {
      const result = db.prepare(`
        INSERT INTO inventory (
          part_number, name, description, category, quantity,
          min_quantity, unit, unit_cost, location, supplier, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        part_number, name, description || null, category || null,
        quantity, min_quantity || 0, unit || null, unit_cost || null,
        location || null, supplier || null, notes || null
      );

      res.status(201).json({ id: result.lastInsertRowid, message: 'Inventory item created successfully' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Part number already exists' });
      }
      console.error('Create inventory item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update inventory item (admin/manager only)
router.put('/:id', roleMiddleware('admin', 'manager'), (req: AuthRequest, res: Response) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'part_number', 'name', 'description', 'category', 'quantity',
      'min_quantity', 'unit', 'unit_cost', 'location', 'supplier', 'notes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Adjust inventory quantity
router.post('/:id/adjust', roleMiddleware('admin', 'manager', 'technician'), (req: AuthRequest, res: Response) => {
  const { quantity, adjustment_type, notes } = req.body;

  if (!quantity || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Quantity must be a number' });
  }

  if (!adjustment_type || !['add', 'remove', 'set'].includes(adjustment_type)) {
    return res.status(400).json({ error: 'Invalid adjustment type' });
  }

  try {
    const item = db.prepare('SELECT quantity FROM inventory WHERE id = ?').get(req.params.id) as any;
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    let newQuantity: number;

    if (adjustment_type === 'add') {
      newQuantity = item.quantity + quantity;
    } else if (adjustment_type === 'remove') {
      newQuantity = item.quantity - quantity;
    } else { // set
      newQuantity = quantity;
    }

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient quantity. Cannot reduce below 0.' });
    }

    db.prepare(`
      UPDATE inventory
      SET quantity = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newQuantity, req.params.id);

    res.json({ message: 'Inventory adjusted successfully', new_quantity: newQuantity });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete inventory item (admin only)
router.delete('/:id', roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
