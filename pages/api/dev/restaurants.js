// pages/api/dev/restaurants.js
const { adminDb } = require('../../../lib/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

const DEV_PASSWORD = process.env.DEV_PORTAL_PASSWORD || 'restaurantos-dev-2026';

function auth(req) {
  return req.headers['x-dev-password'] === DEV_PASSWORD;
}

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list all restaurants
  if (req.method === 'GET') {
    const snap = await adminDb.collection('restaurants').get();
    const restaurants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ restaurants });
  }

  // POST — create restaurant + tables
  if (req.method === 'POST') {
    const { name, tagline, address, phone, tableCount } = req.body;
    if (!name || !tableCount) return res.status(400).json({ error: 'name and tableCount required' });

    const restRef = await adminDb.collection('restaurants').add({
      name, tagline: tagline || '', address: address || '', phone: phone || '',
      created_at: FieldValue.serverTimestamp(),
    });

    const tables = [];
    for (let i = 1; i <= Number(tableCount); i++) {
      const token = 'tbl-' + crypto.randomBytes(4).toString('hex');
      const tRef = await adminDb.collection('tables').add({
        restaurant_id: restRef.id,
        number: i,
        token,
        seats: 4,
        status: 'available',
        created_at: FieldValue.serverTimestamp(),
      });
      tables.push({ id: tRef.id, number: i, token });
    }
    return res.status(201).json({ restaurantId: restRef.id, tables });
  }

  // DELETE — delete restaurant (and its sub-docs)
  if (req.method === 'DELETE') {
    const { restaurantId } = req.body;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });
    const collections = ['tables', 'menu_items', 'staff', 'orders'];
    for (const col of collections) {
      const snap = await adminDb.collection(col).where('restaurant_id', '==', restaurantId).get();
      const batch = adminDb.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await adminDb.collection('restaurants').doc(restaurantId).delete();
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
