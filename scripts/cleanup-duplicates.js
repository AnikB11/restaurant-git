// scripts/cleanup-duplicates.js
// Removes duplicate menu items from Firestore (keeps one of each)

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function cleanup() {
  console.log('🧹 Cleaning up duplicate menu items...\n');

  const snapshot = await db.collection('menu_items')
    .where('restaurant_id', '==', 'rest_01')
    .get();

  console.log(`Found ${snapshot.size} total menu items in database.`);

  // Group by name
  const byName = {};
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!byName[data.name]) {
      byName[data.name] = [];
    }
    byName[data.name].push(doc.id);
  });

  // Delete duplicates (keep only the first one for each name)
  let deleted = 0;
  for (const [name, ids] of Object.entries(byName)) {
    if (ids.length > 1) {
      console.log(`  "${name}" has ${ids.length} copies — deleting ${ids.length - 1} duplicates`);
      for (let i = 1; i < ids.length; i++) {
        await db.collection('menu_items').doc(ids[i]).delete();
        deleted++;
      }
    }
  }

  // Verify final count
  const finalSnapshot = await db.collection('menu_items')
    .where('restaurant_id', '==', 'rest_01')
    .get();

  console.log(`\n✅ Deleted ${deleted} duplicates.`);
  console.log(`📋 ${finalSnapshot.size} unique menu items remaining.\n`);

  // List remaining items
  const remaining = finalSnapshot.docs.map(d => d.data());
  const categories = [...new Set(remaining.map(i => i.category))];
  categories.forEach(cat => {
    const items = remaining.filter(i => i.category === cat);
    console.log(`  ${cat}: ${items.map(i => i.name).join(', ')}`);
  });

  process.exit(0);
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
