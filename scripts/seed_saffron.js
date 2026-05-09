const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('./serviceAccountKey.json');
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function seedSaffron() {
  console.log('Seeding Saffron Hotel (Premium Demo)...');

  // 1. Create Restaurant
  const restRef = await db.collection('restaurants').add({
    name: 'Saffron Hotel',
    tagline: 'A Premium Dining Experience',
    address: '123 Luxury Avenue',
    phone: '+1 800 SAFFRON',
    isPremium: true,
    created_at: FieldValue.serverTimestamp(),
  });
  console.log('Created Restaurant:', restRef.id);

  // 2. Create Table 1
  const token = 'saffron-' + crypto.randomBytes(4).toString('hex');
  const tableRef = await db.collection('tables').add({
    restaurant_id: restRef.id,
    number: 1,
    token: token,
    seats: 4,
    status: 'available',
    created_at: FieldValue.serverTimestamp(),
  });
  console.log('Created Table 1:', tableRef.id);

  // 3. Create Interactive Menu with Photos
  const menuItems = [
    {
      name: 'Truffle Mushroom Risotto',
      category: 'Mains',
      price: 1200,
      description: 'Creamy arborio rice with wild mushrooms, finished with white truffle oil and aged parmesan.',
      image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Wagyu Ribeye Steak',
      category: 'Mains',
      price: 4500,
      description: 'Grade A5 Wagyu beef, perfectly seared, served with garlic herb butter and asparagus.',
      image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Saffron Signature Cocktail',
      category: 'Drinks',
      price: 850,
      description: 'A luxurious blend of premium gin, saffron infusion, and elderflower tonic.',
      image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Burrata Salad',
      category: 'Starters',
      price: 950,
      description: 'Fresh Italian burrata, heirloom tomatoes, basil pesto, and balsamic glaze.',
      image_url: 'https://images.unsplash.com/photo-1606850780554-b55ea40f0ebb?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Gold Leaf Chocolate Fondant',
      category: 'Desserts',
      price: 1500,
      description: 'Warm dark chocolate lava cake topped with edible 24k gold leaf and vanilla bean ice cream.',
      image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=600&auto=format&fit=crop',
    }
  ];

  for (const item of menuItems) {
    await db.collection('menu_items').add({
      restaurant_id: restRef.id,
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      image_url: item.image_url,
      available: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  console.log('Created Menu Items with Premium Photos');

  console.log('\n--- SEED COMPLETE ---');
  console.log(`Access the premium guest menu at: /menu?tableId=${tableRef.id} or /menu?token=${token}`);
}

seedSaffron().catch(console.error);
