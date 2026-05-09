const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('./serviceAccountKey.json');
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function addBurger() {
  console.log('Adding Premium Burger to Saffron Hotel...');
  
  // Find Saffron Hotel
  const snap = await db.collection('restaurants').where('name', '==', 'Saffron Hotel').limit(1).get();
  if (snap.empty) {
    console.log('Saffron Hotel not found!');
    return;
  }
  const restId = snap.docs[0].id;

  const burger = {
    restaurant_id: restId,
    name: 'Truffle Wagyu Burger',
    category: 'Mains',
    price: 1800,
    description: 'Double Wagyu beef patty, black truffle aioli, aged gruyere cheese, caramelized onions, and butter lettuce on a toasted artisanal brioche bun. Served with truffle parmesan fries.',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    available: true,
    macros: { calories: 950, protein: '45g', carbs: '55g', fat: '60g' },
    ingredients: ['Wagyu Beef Patty', 'Truffle Aioli', 'Aged Gruyere', 'Caramelized Onions', 'Brioche Bun', 'Butter Lettuce'],
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  };

  await db.collection('menu_items').add(burger);
  console.log('Added Truffle Wagyu Burger successfully.');
}

addBurger().catch(console.error);
