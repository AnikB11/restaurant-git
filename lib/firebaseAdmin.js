// lib/firebaseAdmin.js — Server-side only (used by pages/api routes)
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = require('../scripts/serviceAccountKey.json');
  initializeApp({ credential: cert(serviceAccount) });
}

module.exports = {
  adminAuth: getAuth(),
  adminDb: getFirestore(),
};
