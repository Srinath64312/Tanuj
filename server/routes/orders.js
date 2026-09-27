const express = require('express');
const router = express.Router();
const { db } = require('../db');

// POST checkout - create order and order items with UPI verification support
router.post('/', (req, res) => {
  try {
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      postal_code,
      items,
      total_amount,
      payment_method,
      upi_id,
      upi_txn_id,
      payment_screenshot
    } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'Customer details, phone, and non-empty cart items are required' });
    }

    const orderNumber = 'TM-' + Math.floor(100000 + Math.random() * 900000);

    const orderStmt = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, city, postal_code, total_amount, payment_method,
        upi_id, upi_txn_id, payment_screenshot, payment_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const paymentStatus = upi_txn_id ? 'pending_verification' : 'pending_verification';

    const orderResult = orderStmt.run(
      orderNumber,
      user_id || null,
      customer_name.trim(),
      customer_email.toLowerCase().trim(),
      customer_phone.trim(),
      shipping_address.trim(),
      city || 'N/A',
      postal_code || 'N/A',
      parseFloat(total_amount) || 0,
      payment_method || 'UPI (9396310900)',
      upi_id || '9396310900@ybl',
      upi_txn_id || null,
      payment_screenshot || null,
      paymentStatus,
      'processing'
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // Insert order items
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, item_type, magnet_id, custom_order_id, title, unit_price, quantity, subtotal, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      const subtotal = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 1);
      itemStmt.run(
        orderId,
        item.item_type || 'catalog',
        item.magnet_id || null,
        item.custom_order_id || null,
        item.title || 'Teen Magnet',
        parseFloat(item.unit_price) || 0,
        parseInt(item.quantity) || 1,
        subtotal,
        JSON.stringify(item.details || {})
      );

      // Decrement stock if catalog item
      if (item.magnet_id) {
        db.prepare(`UPDATE magnets SET stock = MAX(0, stock - ?) WHERE id = ?`).run(
          parseInt(item.quantity) || 1,
          item.magnet_id
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Please complete UPI payment if not done.',
      order_id: orderId,
      order_number: orderNumber
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all orders
router.get('/', (req, res) => {
  try {
    const ordersStmt = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`);
    const orders = ordersStmt.all();

    const itemsStmt = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`);
    
    const enrichedOrders = orders.map(order => {
      const items = itemsStmt.all(order.id).map(item => ({
        ...item,
        details: item.details_json ? JSON.parse(item.details_json) : {}
      }));
      return { ...order, items };
    });

    res.json({ success: true, count: enrichedOrders.length, data: enrichedOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH verify UPI payment (Admin)
router.patch('/:id/verify-payment', (req, res) => {
  try {
    const { payment_status, status } = req.body;
    const stmt = db.prepare(`
      UPDATE orders 
      SET payment_status = COALESCE(?, payment_status),
          status = COALESCE(?, status)
      WHERE id = ?
    `);
    const result = stmt.run(payment_status, status, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Payment verification status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
