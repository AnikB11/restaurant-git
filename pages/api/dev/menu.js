// pages/api/dev/menu.js
const { adminDb } = require('../../../lib/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const DEV_PASSWORD = process.env.DEV_PORTAL_PASSWORD || 'restaurantos-dev-2026';
function auth(req) { return req.headers['x-dev-password'] === DEV_PASSWORD; }

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });
    const snap = await adminDb.collection('menu_items')
      .where('restaurant_id', '==', restaurantId)
      .orderBy('category').orderBy('name').get();
    return res.status(200).json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  }

  if (req.method === 'POST') {
    const { restaurantId, name, category, price, description, image_url } = req.body;
    if (!restaurantId || !name || !category || price === undefined)
      return res.status(400).json({ error: 'Missing fields' });
    const ref = await adminDb.collection('menu_items').add({
      restaurant_id: restaurantId, name, category,
      price: Number(price), description: description || '',
      image_url: image_url || null,
      available: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ id: ref.id });
  }

  if (req.method === 'DELETE') {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId required' });
    await adminDb.collection('menu_items').doc(itemId).delete();
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
