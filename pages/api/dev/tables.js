// pages/api/dev/tables.js
const { adminDb } = require('../../../lib/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

const DEV_PASSWORD = process.env.DEV_PORTAL_PASSWORD || 'restaurantos-dev-2026';
function auth(req) { return req.headers['x-dev-password'] === DEV_PASSWORD; }

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });
    const snap = await adminDb.collection('tables')
      .where('restaurant_id', '==', restaurantId)
      .orderBy('number').get();
    return res.status(200).json({ tables: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  }

  // Add a single new table
  if (req.method === 'POST') {
    const { restaurantId, number, seats } = req.body;
    if (!restaurantId || !number) return res.status(400).json({ error: 'Missing fields' });
    const token = 'tbl-' + crypto.randomBytes(4).toString('hex');
    const ref = await adminDb.collection('tables').add({
      restaurant_id: restaurantId,
      number: Number(number),
      seats: Number(seats) || 4,
      token,
      status: 'available',
      created_at: FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ id: ref.id, token });
  }

  if (req.method === 'DELETE') {
    const { tableId } = req.body;
    if (!tableId) return res.status(400).json({ error: 'tableId required' });
    await adminDb.collection('tables').doc(tableId).delete();
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
