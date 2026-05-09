// scripts/seed.js
// Run with: node scripts/seed.js
// Make sure to set FIREBASE_SERVICE_ACCOUNT env var or update the path below

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Load your service account JSON here
// Download from: Firebase Console → Project Settings → Service accounts
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Restaurant ────────────────────────────────────────────────────
  const restaurantRef = db.collection('restaurants').doc('rest_01');
  await restaurantRef.set({
    name: 'Saffron Garden',
    tagline: 'Authentic Indian Cuisine',
    address: 'Bandra West, Mumbai',
    phone: '+91 98765 43210',
    created_at: new Date(),
  });
  console.log('✅ Restaurant created: Saffron Garden (ID: rest_01)');

  // ── 2. Tables ────────────────────────────────────────────────────────
  const tables = [
    { number: 1, token: 'tbl-a1b2c3', seats: 4 },
    { number: 2, token: 'tbl-d4e5f6', seats: 2 },
    { number: 3, token: 'tbl-g7h8i9', seats: 6 },
    { number: 4, token: 'tbl-j0k1l2', seats: 4 },
    { number: 5, token: 'tbl-m3n4o5', seats: 8 },
  ];

  for (const t of tables) {
    await db.collection('tables').add({
      restaurant_id: 'rest_01',
      number: t.number,
      token: t.token,
      seats: t.seats,
      status: 'available',
      created_at: new Date(),
    });
    console.log(`✅ Table ${t.number} → QR token: ${t.token}`);
    console.log(`   Guest URL: http://localhost:3000/menu?token=${t.token}`);
  }

  // ── 3. Menu Items ────────────────────────────────────────────────────
  const menuItems = [
    // Drinks
    { category: 'Drinks', name: 'Mineral Water', price: 40, description: 'Chilled 500ml bottle', available: true },
    { category: 'Drinks', name: 'Masala Chai', price: 80, description: 'Classic spiced Indian tea', available: true },
    { category: 'Drinks', name: 'Fresh Lime Soda', price: 120, description: 'Squeezed lime with sparkling water', available: true },
    { category: 'Drinks', name: 'Mango Lassi', price: 160, description: 'Thick yogurt mango smoothie', available: true },
    { category: 'Drinks', name: 'Cold Coffee', price: 180, description: 'Iced coffee with cream', available: true },
    { category: 'Drinks', name: 'Virgin Mojito', price: 200, description: 'Mint, lime, and soda', available: true },

    // Starters
    { category: 'Starters', name: 'Samosa (2 pcs)', price: 120, description: 'Crispy pastry with spiced potato filling, served with mint chutney', available: true },
    { category: 'Starters', name: 'Paneer Tikka', price: 320, description: 'Marinated cottage cheese grilled in tandoor', available: true },
    { category: 'Starters', name: 'Chicken 65', price: 380, description: 'Deep fried spicy chicken with curry leaves', available: true },
    { category: 'Starters', name: 'Veg Spring Rolls', price: 220, description: 'Crispy rolls with mixed vegetables', available: true },
    { category: 'Starters', name: 'Hara Bhara Kebab', price: 280, description: 'Spinach and pea patties with green chutney', available: true },

    // Mains
    { category: 'Mains', name: 'Butter Chicken', price: 480, description: 'Tender chicken in rich tomato-butter gravy, best with naan', available: true },
    { category: 'Mains', name: 'Dal Makhani', price: 340, description: 'Slow-cooked black lentils with cream and butter', available: true },
    { category: 'Mains', name: 'Biryani (Chicken)', price: 520, description: 'Fragrant long-grain rice with spiced chicken', available: true },
    { category: 'Mains', name: 'Palak Paneer', price: 380, description: 'Cottage cheese in creamy spinach gravy', available: true },
    { category: 'Mains', name: 'Lamb Rogan Josh', price: 580, description: 'Slow-cooked lamb in Kashmiri spices', available: true },
    { category: 'Mains', name: 'Veg Thali', price: 420, description: 'Complete meal: 2 sabzis, dal, rice, roti, salad, pickle', available: true },
    { category: 'Mains', name: 'Garlic Naan', price: 80, description: 'Tandoor-baked bread with garlic butter', available: true },
    { category: 'Mains', name: 'Steamed Rice', price: 120, description: 'Long-grain basmati', available: true },

    // Desserts
    { category: 'Desserts', name: 'Gulab Jamun', price: 140, description: 'Soft milk dumplings in rose-scented sugar syrup', available: true },
    { category: 'Desserts', name: 'Kulfi (Mango)', price: 160, description: 'Traditional Indian ice cream with mango', available: true },
    { category: 'Desserts', name: 'Gajar Ka Halwa', price: 180, description: 'Slow-cooked carrot pudding with cardamom', available: true },
    { category: 'Desserts', name: 'Rasmalai', price: 200, description: 'Soft cheese patties in saffron-flavored milk', available: true },
  ];

  for (const item of menuItems) {
    await db.collection('menu_items').add({
      restaurant_id: 'rest_01',
      ...item,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
  console.log(`\n✅ ${menuItems.length} menu items created`);

  // ── 4. Staff accounts ────────────────────────────────────────────────
  const staffMembers = [
    { email: 'kitchen@saffron.com', password: 'kitchen123', name: 'Ravi Kumar', role: 'kitchen' },
    { email: 'counter@saffron.com', password: 'counter123', name: 'Priya Sharma', role: 'counter' },
    { email: 'admin@saffron.com', password: 'admin123', name: 'Admin', role: 'admin' },
  ];

  for (const staff of staffMembers) {
    try {
      const userRecord = await auth.createUser({
        email: staff.email,
        password: staff.password,
        displayName: staff.name,
      });
      await db.collection('staff').doc(userRecord.uid).set({
        restaurant_id: 'rest_01',
        name: staff.name,
        email: staff.email,
        role: staff.role,
        created_at: new Date(),
      });
      console.log(`✅ Staff: ${staff.email} / ${staff.password} (${staff.role})`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        console.log(`⚠️  ${staff.email} already exists, skipping`);
      } else {
        console.error(`❌ Failed to create ${staff.email}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('───────────────────────────────────────');
  console.log('STAFF LOGINS:');
  console.log('  Kitchen:  kitchen@saffron.com / kitchen123');
  console.log('  Counter:  counter@saffron.com / counter123');
  console.log('───────────────────────────────────────');
  console.log('GUEST QR TOKENS:');
  tables.forEach((t) => {
    console.log(`  Table ${t.number}: /menu?token=${t.token}`);
  });
  console.log('───────────────────────────────────────\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
