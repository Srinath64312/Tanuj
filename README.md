# 🧲 Teen Magnets — Handcrafted 3" x 3" Square Fridge Magnets Web Platform

Full-stack e-commerce web platform for **Teen Magnets**, featuring a custom Node.js Express backend, native SQLite database, interactive Refrigerator Sandbox canvas, Square Custom Photo Studio, Google OAuth 2.0 authentication, 2-step shipping address and UPI payment checkout, and WhatsApp order routing.

---

## 🌟 Key Features

1. **Square Magnet Catalog (3" x 3")**:
   - Exclusively 3" x 3" square fridge magnets across categories: *Aesthetic Quotes, Anime & Gaming, Custom Photo Squares, Travel & Cities*.
   - Star reviews, quick-look modal, and high-gloss / velvet matte / holographic finishes.

2. **Custom Square Photo Studio (Creator Lab)**:
   - Live visual editor for personalized square photo magnets (₹99).
   - Instant image upload with live fitting, custom captions, typography selector, and finish options.

3. **Interactive Fridge Door Simulator (Sandbox)**:
   - Draggable square magnets on realistic refrigerator canvas textures (*Matte Obsidian, Brushed Stainless, Retro Mint, Vintage Cream*).
   - Magnetic snap sound effects via Web Audio API.

4. **Multi-Step Checkout Flow**:
   - **Step 1:** Recipient delivery address, city, pincode, and contact details with instant editing and local storage persistence.
   - **Step 2:** Address summary review with *"✏️ Change Address"* button, dynamic UPI QR code generator (`9396310900@ybl`), deep links for GPay / PhonePe / Paytm, and 12-digit UTR reference input.

5. **Direct WhatsApp Order Notifications**:
   - Every placed order triggers an instant WhatsApp order receipt routed to **`+91 9396310899`** with customer details, delivery address, ordered items, and payment reference.

6. **Authentication & Google OAuth 2.0**:
   - Dual-mode authentication: Standard username/password login (supporting `admin`) and Google OAuth 2.0 with 1-click account selection.

7. **Light & Dark Mode**:
   - High-contrast responsive theme toggle with instant `localStorage` memory and zero flicker.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js 5, Multer (file uploads), native `node:sqlite` (SQLite).
- **Frontend**: Single Page Application, Tailwind CSS, Lucide Icons, QRCode.js, Web Audio API.
- **Database**: SQLite (`server/magnets.db`) with auto-seeding.

---

## 🚀 Quick Start

### 1. Install & Run
```bash
# Clone the repository
git clone https://github.com/your-username/teen-magnets.git
cd teen-magnets

# Install dependencies
npm install

# Start server
npm start
```

### 2. Access Web Application
Open your browser at `http://localhost:3000`.

---

## ☁️ Free Cloud Deployment

### Deploy on Render.com (Recommended)
1. Push this repository to your GitHub account.
2. Sign up at [Render.com](https://render.com) (Free Tier).
3. Click **New +** -> **Web Service** -> Connect your GitHub repo.
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Deploy Web Service**.

---

## 📞 Support & Contacts
- **Brand:** Teen Magnets
- **Founder:** Mokshith Guddeti (`mokshithguddeti@gmail.com`)
- **UPI Beneficiary:** `9396310900`
- **Order Notification WhatsApp:** `9396310899`
