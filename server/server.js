const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initDatabase } = require('./db');

const authRouter = require('./routes/auth');
const magnetsRouter = require('./routes/magnets');
const customMagnetsRouter = require('./routes/customMagnets');
const ordersRouter = require('./routes/orders');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite Database
initDatabase();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config for magnet photos & payment screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static frontend & uploads
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api', magnetsRouter);
app.use('/api/custom-magnets', customMagnetsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

// Photo Upload Endpoint (for customer photo magnets, payment screenshots, or catalog items)
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    message: 'Photo uploaded successfully'
  });
});

// Fallback to index.html for SPA client routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🧲 Teen Magnets Web Platform & API Server`);
  console.log(`🚀 Live at: http://localhost:${PORT}`);
  console.log(`📱 Contact: 9396310900 | mokshithguddeti@gmail.com`);
  console.log(`💳 UPI Payment Beneficiary: 9396310900`);
  console.log(`====================================================`);
});
