const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('./serviceAccountKey.json');
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function updateMacros() {
  console.log('Adding macros and ingredients to menu items...');
  const snap = await db.collection('menu_items').get();
  
  const mockData = {
    'Truffle Mushroom Risotto': {
      macros: { calories: 520, protein: '14g', carbs: '65g', fat: '22g' },
      ingredients: ['Arborio Rice', 'Wild Mushrooms', 'White Truffle Oil', 'Parmesan Reggiano', 'Vegetable Broth', 'Garlic']
    },
    'Wagyu Ribeye Steak': {
      macros: { calories: 850, protein: '68g', carbs: '5g', fat: '62g' },
      ingredients: ['A5 Wagyu Beef', 'Herb Butter', 'Sea Salt', 'Black Pepper', 'Asparagus', 'Garlic']
    },
    'Saffron Signature Cocktail': {
      macros: { calories: 180, protein: '0g', carbs: '15g', fat: '0g' },
      ingredients: ['Premium Gin', 'Saffron Infusion', 'Elderflower Tonic', 'Citrus Zest', 'Edible Flowers']
    },
    'Burrata Salad': {
      macros: { calories: 410, protein: '18g', carbs: '12g', fat: '32g' },
      ingredients: ['Fresh Burrata', 'Heirloom Tomatoes', 'Basil Pesto', 'Balsamic Glaze', 'Extra Virgin Olive Oil']
    },
    'Gold Leaf Chocolate Fondant': {
      macros: { calories: 650, protein: '8g', carbs: '55g', fat: '42g' },
      ingredients: ['Dark Belgian Chocolate', '24k Edible Gold Leaf', 'Madagascar Vanilla Bean Ice Cream', 'Butter', 'Free-range Eggs', 'Flour']
    }
  };

  const defaultData = {
    macros: { calories: 300, protein: '10g', carbs: '30g', fat: '15g' },
    ingredients: ['Fresh Ingredients', 'Chef\'s Secret Spices', 'Love']
  };

  let updated = 0;
  for (const doc of snap.docs) {
    const item = doc.data();
    const data = mockData[item.name] || defaultData;
    
    await doc.ref.update({
      macros: data.macros,
      ingredients: data.ingredients
    });
    updated++;
  }
  
  console.log(`Updated ${updated} menu items with macros and ingredients.`);
}

updateMacros().catch(console.error);
