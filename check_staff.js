const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./scripts/serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const auth = getAuth();

async function check() {
  const users = await auth.listUsers();
  for (const user of users.users) {
    const doc = await db.collection('staff').doc(user.uid).get();
    console.log(`User ${user.email} (UID: ${user.uid}): hasStaffDoc = ${doc.exists}`);
  }
}
check();
