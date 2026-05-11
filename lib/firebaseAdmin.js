// lib/firebaseAdmin.js — Server-side only (used by pages/api routes)
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const serviceAccount = require('../scripts/serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (e) {
    admin.initializeApp();
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

module.exports = { admin, adminDb, adminAuth };
