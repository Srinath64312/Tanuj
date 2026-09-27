const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET dashboard statistics
router.get('/', (req, res) => {
  try {
    const totalMagnets = db.prepare(`SELECT COUNT(*) as count FROM magnets`).get().count;
    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders`).get().count;
    const totalSales = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders`).get().total;
    const totalCustom = db.prepare(`SELECT COUNT(*) as count FROM custom_orders`).get().count;
    
    // Recent orders
    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, total_amount, status, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // Top rated magnets
    const topMagnets = db.prepare(`
      SELECT m.id, m.title, m.price, m.category_id, COALESCE(AVG(r.rating), 5.0) as rating, COUNT(r.id) as reviews
      FROM magnets m
      LEFT JOIN reviews r ON m.id = r.magnet_id
      GROUP BY m.id
      ORDER BY rating DESC, reviews DESC
      LIMIT 5
    `).all();

    // Low stock magnets
    const lowStock = db.prepare(`
      SELECT id, title, stock, price 
      FROM magnets 
      WHERE stock <= 35 
      ORDER BY stock ASC
    `).all();

    res.json({
      success: true,
      data: {
        totalMagnets,
        totalOrders,
        totalSales: Number(totalSales).toFixed(2),
        totalCustom,
        recentOrders,
        topMagnets,
        lowStock
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
