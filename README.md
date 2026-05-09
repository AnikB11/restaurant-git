# 🍽️ Restaurant OS — Smart QR-Based POS System

A full-stack MVP for a QR-based restaurant operating system built with **Next.js 14** and **Firebase**. Enables guests to order, track, and pay from their phones while kitchen and reception manage operations in real time.

---

## ✨ Features

| Role | Capabilities |
|------|-------------|
| 🧑 **Guest** | QR-based table access · Guided drinks-first UX · Full menu browsing · Cart management · Real-time order tracking · Bill request with tip selection · Call staff |
| 👨‍🍳 **Kitchen** | Real-time order queue · Status updates (Received → Preparing → Ready) · Menu item availability toggle · Staff call alerts |
| 💼 **Counter/Reception** | Active table overview · Revenue dashboard · Bill generation · Mark payment complete |

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, Tailwind CSS
- **Backend**: Firebase Firestore (real-time NoSQL), Firebase Auth
- **Fonts**: Playfair Display + DM Sans
- **Icons**: Lucide React

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd restaurant-os
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database** (start in test mode)
4. Enable **Authentication** → Email/Password
5. Go to Project Settings → Your Apps → Add Web App
6. Copy the config values

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Firebase config values.

### 4. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Seed Demo Data

```bash
# Install firebase-admin for seeding
npm install firebase-admin --save-dev

# Download service account JSON from:
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# Save it as scripts/serviceAccountKey.json

node scripts/seed.js
```

This creates:
- 1 restaurant (Saffron Garden)
- 5 tables with unique QR tokens
- 22 menu items across 4 categories
- 3 staff accounts

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔗 URLs

| URL | Description |
|-----|-------------|
| `/` | Staff portal home |
| `/menu?token=tbl-a1b2c3` | Guest menu for Table 1 |
| `/menu?token=tbl-d4e5f6` | Guest menu for Table 2 |
| `/kitchen` | Kitchen dashboard |
| `/counter` | Reception dashboard |

---

## 👥 Demo Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Kitchen | kitchen@saffron.com | kitchen123 |
| Counter | counter@saffron.com | counter123 |
| Admin | admin@saffron.com | admin123 |

---

## 📁 Project Structure

```
restaurant-os/
├── pages/
│   ├── _app.js              # App wrapper
│   ├── index.js             # Staff portal home
│   ├── menu.js              # 📱 Guest ordering experience
│   ├── kitchen.js           # 👨‍🍳 Kitchen dashboard
│   └── counter.js           # 💼 Reception dashboard
│
├── components/
│   ├── LoginForm.jsx         # Reusable staff login
│   ├── MenuCard.jsx          # Menu item card
│   ├── Cart.jsx              # Cart with quantity + notes
│   ├── OrderTracking.jsx     # Guest order status tracker
│   ├── OrderCard.jsx         # Order card (kitchen + counter)
│   ├── FloatingActions.jsx   # Guest FAB (add/bill/call)
│   └── BillingModal.jsx      # Tip selection + bill request
│
├── lib/
│   ├── firebase.js           # Firebase initialization
│   └── hooks/
│       ├── useAuth.js        # Auth state + login/logout
│       ├── useMenu.js        # Real-time menu items
│       └── useOrders.js      # Orders CRUD + real-time listeners
│
├── styles/
│   └── globals.css           # Tailwind + custom styles
│
├── scripts/
│   └── seed.js               # Database seeder
│
├── firestore.rules           # Security rules
├── .env.local.example        # Environment template
└── tailwind.config.js
```

---

## 🗄️ Firestore Schema

### `restaurants/{id}`
```json
{
  "name": "Saffron Garden",
  "tagline": "Authentic Indian Cuisine",
  "address": "...",
  "phone": "..."
}
```

### `tables/{id}`
```json
{
  "restaurant_id": "rest_01",
  "number": 1,
  "token": "tbl-a1b2c3",
  "seats": 4,
  "status": "available"
}
```

### `menu_items/{id}`
```json
{
  "restaurant_id": "rest_01",
  "name": "Butter Chicken",
  "category": "Mains",
  "price": 480,
  "description": "...",
  "image_url": null,
  "available": true
}
```

### `orders/{id}`
```json
{
  "restaurant_id": "rest_01",
  "table_id": "...",
  "table_number": 3,
  "status": "preparing",
  "items": [
    { "name": "Butter Chicken", "price": 480, "quantity": 2, "notes": "less spicy" }
  ],
  "subtotal": 960,
  "tip": 144,
  "tip_percent": 15,
  "total": 1104,
  "bill_requested": false,
  "staff_called": false,
  "payment_status": "pending",
  "created_at": "timestamp"
}
```

### `staff/{uid}`
```json
{
  "restaurant_id": "rest_01",
  "name": "Ravi Kumar",
  "email": "kitchen@saffron.com",
  "role": "kitchen"
}
```

---

## 🔄 Real-Time Data Flow

```
Guest places order
      ↓
Firestore `orders` collection (onSnapshot)
      ↓
Kitchen sees new order card → Updates status
      ↓
Guest sees status update live (no refresh)
      ↓
Guest requests bill → Counter sees alert
      ↓
Counter marks as paid → Order cleared
```

---

## 🎨 QR Code Generation

Generate QR codes for table URLs using any QR library:

```bash
npm install qrcode
```

```js
const QRCode = require('qrcode');
const url = 'https://your-domain.com/menu?token=tbl-a1b2c3';
QRCode.toFile('table1-qr.png', url, { width: 400 });
```

---

## 🚧 Extending the MVP

- **Images**: Add `image_url` to menu items and upload via Firebase Storage
- **Multi-restaurant**: Already supported via `restaurant_id` on every document
- **UPI/Razorpay**: Integrate payment gateway in `BillingModal`
- **Push Notifications**: Use Firebase Cloud Messaging for kitchen alerts
- **Analytics**: Extend revenue tab with Chart.js or Recharts
- **QR Printing**: Build a `/admin/tables` page to generate + print QR codes
