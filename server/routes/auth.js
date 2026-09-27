const express = require('express');
const router = express.Router();
const { db, hashPassword, verifyPassword } = require('../db');

// Environment variables for optional Google OAuth 2.0 Client credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

// 1. GET /api/auth/google/login - Redirects to official Google OAuth 2.0 Consent Screen
router.get('/google/login', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    // If no Google Client ID configured in .env, redirect to frontend with notice
    return res.redirect('/?google_auth_notice=no_client_id');
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  };

  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
});

// 2. GET /api/auth/google/callback - Receives Authorization Code from Google
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.redirect('/?auth_error=google_cancelled');
  }

  try {
    // Exchange authorization code for access token with Google
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values).toString()
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect('/?auth_error=token_exchange_failed');
    }

    // Fetch user profile from Google UserInfo endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userRes.json();

    const email = (googleUser.email || '').toLowerCase().trim();
    const name = googleUser.name || 'Google User';
    const avatar_url = googleUser.picture || '';
    const google_id = googleUser.id || '';

    // Find or create user in SQLite database
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      const stmt = db.prepare(`
        INSERT INTO users (name, email, phone, provider, avatar_url, role)
        VALUES (?, ?, '', 'google', ?, 'customer')
      `);
      const result = stmt.run(name, email, avatar_url);
      user = {
        id: Number(result.lastInsertRowid),
        name,
        email,
        phone: '',
        avatar_url,
        provider: 'google',
        role: 'customer'
      };
    } else {
      user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url || avatar_url,
        provider: 'google',
        role: user.role
      };
    }

    // Redirect to frontend with user session payload
    const userPayload = encodeURIComponent(JSON.stringify(user));
    res.redirect(`/?auth_success=true&user=${userPayload}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect('/?auth_error=server_error');
  }
});

// 3. POST /api/auth/google - One-Tap / Client-Side Google Authentication (Seamless fallback)
router.post('/google', (req, res) => {
  try {
    const { name, email, avatar_url, phone } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      // Create new Google customer in SQLite
      const stmt = db.prepare(`
        INSERT INTO users (name, email, phone, provider, avatar_url, role)
        VALUES (?, ?, ?, 'google', ?, 'customer')
      `);
      const result = stmt.run(name || 'Google User', cleanEmail, phone || '', avatar_url || '');
      user = {
        id: Number(result.lastInsertRowid),
        name: name || 'Google User',
        email: cleanEmail,
        phone: phone || '',
        avatar_url: avatar_url || '',
        provider: 'google',
        role: 'customer'
      };
    } else {
      user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url || avatar_url || '',
        provider: user.provider || 'google',
        role: user.role
      };
    }

    res.json({
      success: true,
      message: 'Signed in with Google successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/auth/login - Email / Username Login (Supports admin and standard customers)
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email/Username and password are required' });
    }

    const cleanIdentifier = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanIdentifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/auth/signup - Customer Registration
router.post('/signup', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, 'customer')
    `);

    const result = stmt.run(name.trim(), cleanEmail, phone ? phone.trim() : '', passwordHash);
    const userId = Number(result.lastInsertRowid);

    const user = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      role: 'customer'
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/auth/my-orders - Order History for Logged-In User
router.get('/my-orders', (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const ordersStmt = db.prepare(`SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC`);
    const orders = ordersStmt.all(email.toLowerCase().trim());

    const itemsStmt = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`);
    const enrichedOrders = orders.map(order => ({
      ...order,
      items: itemsStmt.all(order.id).map(i => ({
        ...i,
        details: i.details_json ? JSON.parse(i.details_json) : {}
      }))
    }));

    res.json({ success: true, data: enrichedOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
