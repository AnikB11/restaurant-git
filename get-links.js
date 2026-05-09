const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./scripts/serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function getLinks() {
  try {
    const snap = await db.collection('tables').orderBy('number').get();
    console.log('--- Table Links ---');
    snap.forEach(doc => {
      const t = doc.data();
      console.log(`Table ${t.number} (${t.seats} seats): http://localhost:3000/menu?token=${t.token}`);
    });
    console.log('-------------------');
  } catch (err) {
    console.error(err);
  }
}

getLinks();
