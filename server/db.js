const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'magnets.db');
const db = new DatabaseSync(dbPath);

// Password hashing
function hashPassword(password) {
  const salt = 'teen_magnets_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT,
      provider TEXT DEFAULT 'local', -- local, google
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'customer', -- customer, admin
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS magnets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category_id TEXT NOT NULL,
      shape TEXT NOT NULL DEFAULT 'square', -- Exclusively Square Magnets
      dimensions TEXT DEFAULT '3.0" x 3.0"',
      finish TEXT DEFAULT 'Glossy Sheen', -- Glossy Sheen, Velvet Matte, Holographic Sparkle
      magnet_strength TEXT DEFAULT 'Heavy Duty',
      stock INTEGER DEFAULT 50,
      is_featured INTEGER DEFAULT 0,
      image_svg TEXT,
      image_url TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS custom_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      magnet_shape TEXT NOT NULL DEFAULT 'square',
      dimensions TEXT NOT NULL DEFAULT '3.0" x 3.0"',
      finish TEXT NOT NULL DEFAULT 'Glossy Sheen',
      custom_text TEXT,
      font_family TEXT,
      image_path TEXT,
      quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL DEFAULT 99.00,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'UPI (9396310900)',
      upi_id TEXT DEFAULT '9396310900@ybl',
      upi_txn_id TEXT,
      payment_screenshot TEXT,
      payment_status TEXT DEFAULT 'pending_verification',
      status TEXT DEFAULT 'processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_type TEXT DEFAULT 'catalog',
      magnet_id INTEGER,
      custom_order_id INTEGER,
      title TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      details_json TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      magnet_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (magnet_id) REFERENCES magnets (id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function seedData() {
  // 1. Seed Admin Accounts (Supports email: 'admin' and 'mokshithguddeti@gmail.com')
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('👤 Seeding admin accounts...');
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Admin with email 'admin'
    insertUser.run(
      'Mokshith Admin',
      'admin',
      '9396310900',
      hashPassword('Admin@TeenMagnets2026'),
      'admin'
    );

    // Admin with email 'mokshithguddeti@gmail.com'
    insertUser.run(
      'Mokshith Guddeti',
      'mokshithguddeti@gmail.com',
      '9396310900',
      hashPassword('Admin@TeenMagnets2026'),
      'admin'
    );
  }

  // 2. Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, icon, description) 
      VALUES (?, ?, ?, ?)
    `);

    const categories = [
      ['all', 'All Square Magnets', 'sparkles', 'Browse our complete collection of 3"x3" square fridge magnets'],
      ['custom-photo', 'Custom Photo Squares', 'camera', 'Upload your selfies, family memories, and beach road trips'],
      ['anime-gaming', 'Anime & Gaming Squares', 'flame', 'Cyberpunk neon, pixel badges, and anime characters'],
      ['aesthetic-quotes', 'Aesthetic Quotes & Vibes', 'message-square-quote', 'Punchy typography, motivational mantras, and clean aesthetics'],
      ['travel-culture', 'Travel & City Badges', 'map-pin', 'Landmarks, beach sunsets, and globetrotter souvenirs']
    ];

    for (const cat of categories) {
      insertCat.run(...cat);
    }
  }

  // 3. Magnets (All Square 3" x 3")
  const magnetCount = db.prepare('SELECT COUNT(*) as count FROM magnets').get().count;
  if (magnetCount === 0) {
    console.log('🌱 Seeding square fridge magnets catalog...');
    const insertMagnet = db.prepare(`
      INSERT INTO magnets (title, description, price, category_id, shape, dimensions, finish, magnet_strength, stock, is_featured, image_url, image_svg, tags)
      VALUES (?, ?, ?, ?, 'square', '3.0" x 3.0"', ?, ?, ?, ?, ?, ?, ?)
    `);

    const magnets = [
      {
        title: 'Custom Square Photo Magnet',
        description: 'Upload your favorite selfie, couple photo, or road trip memory. Handcrafted in ultra-gloss 3"x3" square frame.',
        price: 99.00,
        category_id: 'custom-photo',
        finish: 'Glossy Sheen',
        magnet_strength: 'Heavy Duty',
        stock: 100,
        is_featured: 1,
        image_url: '/assets/owners.jpg',
        image_svg: null,
        tags: 'photo,custom,square,selfie,friends,beach,trip'
      },
      {
        title: 'Neo Tokyo Cyberpunk Square',
        description: 'Vibrant neon Japanese city street art printed on high-gloss laminated acrylic square magnet.',
        price: 119.00,
        category_id: 'anime-gaming',
        finish: 'Holographic Sparkle',
        magnet_strength: 'Neodymium',
        stock: 50,
        is_featured: 1,
        image_url: null,
        tags: 'anime,tokyo,cyberpunk,neon,japan',
        image_svg: `<svg viewBox="0 0 160 160" class="w-full h-full rounded-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cyberSky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0f0c29"/>
              <stop offset="50%" stop-color="#302b63"/>
              <stop offset="100%" stop-color="#24243e"/>
            </linearGradient>
          </defs>
          <rect width="160" height="160" rx="16" fill="url(#cyberSky)" stroke="#ec4899" stroke-width="3"/>
          <circle cx="120" cy="45" r="24" fill="#ff0844" opacity="0.8"/>
          <!-- Buildings -->
          <rect x="20" y="70" width="30" height="90" fill="#120e2e"/>
          <rect x="55" y="50" width="40" height="110" fill="#1d1544"/>
          <rect x="100" y="80" width="35" height="80" fill="#150f33"/>
          <rect x="62" y="60" width="25" height="8" rx="2" fill="#00f2fe"/>
          <rect x="62" y="75" width="25" height="8" rx="2" fill="#ff007f"/>
          <!-- Text -->
          <text x="80" y="145" fill="#ffffff" font-size="12" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle" letter-spacing="3">TOKYO</text>
        </svg>`
      },
      {
        title: 'Main Character Energy Square',
        description: 'Vibrant hot pink aesthetic typography square magnet for your desk, locker, or fridge.',
        price: 99.00,
        category_id: 'aesthetic-quotes',
        finish: 'Glossy Sheen',
        magnet_strength: 'Standard',
        stock: 65,
        is_featured: 1,
        image_url: null,
        tags: 'quotes,energy,pink,aesthetic,vibes',
        image_svg: `<svg viewBox="0 0 160 160" class="w-full h-full rounded-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="quoteGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ec4899"/>
              <stop offset="50%" stop-color="#8b5cf6"/>
              <stop offset="100%" stop-color="#d946ef"/>
            </linearGradient>
          </defs>
          <rect width="160" height="160" rx="16" fill="url(#quoteGrad)" stroke="#ffffff" stroke-width="3"/>
          <text x="80" y="55" fill="#fef08a" font-size="13" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle">★ MAIN ★</text>
          <text x="80" y="85" fill="#ffffff" font-size="16" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle">CHARACTER</text>
          <text x="80" y="115" fill="#67e8f9" font-size="14" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle">ENERGY</text>
        </svg>`
      },
      {
        title: 'Pixel Heart 8-Bit Gamer Square',
        description: 'Classic full HP heart badge on glossy midnight black square magnet.',
        price: 89.00,
        category_id: 'anime-gaming',
        finish: 'Velvet Matte',
        magnet_strength: 'Neodymium',
        stock: 80,
        is_featured: 1,
        image_url: null,
        tags: 'gaming,pixel,heart,8bit,retro',
        image_svg: `<svg viewBox="0 0 160 160" class="w-full h-full rounded-2xl" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="160" rx="16" fill="#0f172a" stroke="#ef4444" stroke-width="2"/>
          <g transform="translate(10, 10)">
            <rect x="30" y="20" width="30" height="15" fill="#ef4444"/>
            <rect x="80" y="20" width="30" height="15" fill="#ef4444"/>
            <rect x="15" y="35" width="55" height="20" fill="#f87171"/>
            <rect x="70" y="35" width="55" height="20" fill="#ef4444"/>
            <rect x="25" y="38" width="10" height="10" fill="#ffffff"/>
            <rect x="15" y="55" width="110" height="20" fill="#ef4444"/>
            <rect x="25" y="75" width="90" height="20" fill="#dc2626"/>
            <rect x="40" y="95" width="60" height="20" fill="#b91c1c"/>
            <rect x="55" y="115" width="30" height="15" fill="#991b1b"/>
          </g>
        </svg>`
      },
      {
        title: 'Sunset Beach Coast Souvenir',
        description: 'Warm golden hour coastal sunset with silhouettes of palm trees on heavy duty square magnet.',
        price: 99.00,
        category_id: 'travel-culture',
        finish: 'Glossy Sheen',
        magnet_strength: 'Heavy Duty',
        stock: 60,
        is_featured: 0,
        image_url: null,
        tags: 'travel,sunset,beach,coastal,sea',
        image_svg: `<svg viewBox="0 0 160 160" class="w-full h-full rounded-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="beachSunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f59e0b"/>
              <stop offset="50%" stop-color="#ec4899"/>
              <stop offset="100%" stop-color="#3b82f6"/>
            </linearGradient>
          </defs>
          <rect width="160" height="160" rx="16" fill="url(#beachSunset)" stroke="#ffffff" stroke-width="2"/>
          <!-- Sun -->
          <circle cx="80" cy="70" r="30" fill="#fef08a"/>
          <!-- Ocean Horizon -->
          <rect x="0" y="100" width="160" height="60" fill="#1e3a8a" opacity="0.8"/>
          <!-- Palm Tree Silhouette -->
          <path d="M 40 160 Q 55 100 70 80 Q 75 75 80 85" stroke="#0f172a" stroke-width="4" fill="none"/>
          <text x="80" y="145" fill="#ffffff" font-size="11" font-weight="900" font-family="'Inter', sans-serif" text-anchor="middle" letter-spacing="2">GOLDEN COAST</text>
        </svg>`
      }
    ];

    for (const m of magnets) {
      insertMagnet.run(
        m.title,
        m.description,
        m.price,
        m.category_id,
        m.finish,
        m.magnet_strength,
        m.stock,
        m.is_featured,
        m.image_url,
        m.image_svg,
        m.tags
      );
    }
  }

  console.log('✅ Teen Magnets Database (Square Edition) initialized successfully!');
}

module.exports = {
  db,
  initDatabase,
  hashPassword,
  verifyPassword
};
