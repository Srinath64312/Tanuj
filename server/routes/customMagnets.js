const express = require('express');
const router = express.Router();
const { db } = require('../db');

// POST submit a custom magnet design order / builder configuration
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      magnet_shape,
      dimensions,
      finish,
      background_color,
      custom_text,
      text_color,
      font_family,
      icon_type,
      image_path,
      quantity,
      total_price,
      notes
    } = req.body;

    if (!customer_name || !customer_email) {
      return res.status(400).json({ success: false, error: 'Customer name and email are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO custom_orders (
        customer_name, customer_email, magnet_shape, dimensions, finish,
        background_color, custom_text, text_color, font_family, icon_type,
        image_path, quantity, total_price, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      customer_name,
      customer_email,
      magnet_shape || 'rectangle',
      dimensions || '3.0" x 2.0"',
      finish || 'Glossy',
      background_color || '#ff007f',
      custom_text || '',
      text_color || '#ffffff',
      font_family || 'sans-serif',
      icon_type || 'heart',
      image_path || '',
      parseInt(quantity) || 1,
      parseFloat(total_price) || 7.99,
      notes || ''
    );

    res.status(201).json({
      success: true,
      message: 'Custom magnet order created successfully',
      id: Number(result.lastInsertRowid)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all custom designs
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM custom_orders ORDER BY created_at DESC
    `);
    const orders = stmt.all();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single custom design
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare(`SELECT * FROM custom_orders WHERE id = ?`);
    const order = stmt.get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Custom order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_production', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const stmt = db.prepare(`UPDATE custom_orders SET status = ? WHERE id = ?`);
    const result = stmt.run(status, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Custom order not found' });
    }
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
