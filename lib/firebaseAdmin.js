// lib/firebaseAdmin.js — Server-side only (used by pages/api routes)
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

module.exports = admin;
