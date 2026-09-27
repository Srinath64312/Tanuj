const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all categories
router.get('/categories', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT c.*, COUNT(m.id) as magnet_count 
      FROM categories c
      LEFT JOIN magnets m ON c.id = m.category_id
      GROUP BY c.id
      ORDER BY c.id = 'all' DESC, c.name ASC
    `);
    const categories = stmt.all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all magnets with filtering, searching and sorting
router.get('/magnets', (req, res) => {
  try {
    const { category, search, shape, finish, sort, featured } = req.query;
    
    let query = `
      SELECT m.*, 
             COALESCE(AVG(r.rating), 5.0) as average_rating,
             COUNT(r.id) as review_count
      FROM magnets m
      LEFT JOIN reviews r ON m.id = r.magnet_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND m.category_id = ?`;
      params.push(category);
    }

    if (shape && shape !== 'all') {
      query += ` AND m.shape = ?`;
      params.push(shape);
    }

    if (finish && finish !== 'all') {
      query += ` AND m.finish = ?`;
      params.push(finish);
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND m.is_featured = 1`;
    }

    if (search) {
      query += ` AND (m.title LIKE ? OR m.description LIKE ? OR m.tags LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` GROUP BY m.id`;

    // Sorting
    switch (sort) {
      case 'price-asc':
        query += ` ORDER BY m.price ASC`;
        break;
      case 'price-desc':
        query += ` ORDER BY m.price DESC`;
        break;
      case 'rating':
        query += ` ORDER BY average_rating DESC, review_count DESC`;
        break;
      case 'newest':
        query += ` ORDER BY m.id DESC`;
        break;
      default:
        query += ` ORDER BY m.is_featured DESC, m.id ASC`;
        break;
    }

    const stmt = db.prepare(query);
    const magnets = stmt.all(...params);
    res.json({ success: true, count: magnets.length, data: magnets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single magnet details with reviews
router.get('/magnets/:id', (req, res) => {
  try {
    const magnetStmt = db.prepare(`
      SELECT m.*, 
             COALESCE(AVG(r.rating), 5.0) as average_rating,
             COUNT(r.id) as review_count
      FROM magnets m
      LEFT JOIN reviews r ON m.id = r.magnet_id
      WHERE m.id = ?
      GROUP BY m.id
    `);
    const magnet = magnetStmt.get(req.params.id);

    if (!magnet) {
      return res.status(404).json({ success: false, error: 'Magnet not found' });
    }

    const reviewsStmt = db.prepare(`
      SELECT * FROM reviews WHERE magnet_id = ? ORDER BY created_at DESC
    `);
    const reviews = reviewsStmt.all(req.params.id);

    res.json({ success: true, data: { ...magnet, reviews } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new magnet product (Admin or User upload)
router.post('/magnets', (req, res) => {
  try {
    const { title, description, price, category_id, shape, dimensions, finish, magnet_strength, stock, is_featured, image_svg, tags } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({ success: false, error: 'Title, price, and category are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO magnets (title, description, price, category_id, shape, dimensions, finish, magnet_strength, stock, is_featured, image_svg, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description || '',
      parseFloat(price),
      category_id,
      shape || 'rectangle',
      dimensions || '3.0" x 2.0"',
      finish || 'Glossy',
      magnet_strength || 'Heavy Duty',
      parseInt(stock) || 50,
      is_featured ? 1 : 0,
      image_svg || null,
      tags || ''
    );

    res.status(201).json({
      success: true,
      message: 'Magnet created successfully',
      id: Number(result.lastInsertRowid)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST submit a review for a magnet
router.post('/magnets/:id/reviews', (req, res) => {
  try {
    const { author_name, rating, comment } = req.body;
    const magnetId = req.params.id;

    if (!author_name || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Author name, rating (1-5), and comment are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO reviews (magnet_id, author_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(magnetId, author_name, parseInt(rating), comment);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      id: Number(result.lastInsertRowid)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE magnet
router.delete('/magnets/:id', (req, res) => {
  try {
    const stmt = db.prepare(`DELETE FROM magnets WHERE id = ?`);
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Magnet not found' });
    }
    res.json({ success: true, message: 'Magnet deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
