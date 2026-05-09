// pages/api/dev/staff.js
const { adminAuth, adminDb } = require('../../../lib/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const DEV_PASSWORD = process.env.DEV_PORTAL_PASSWORD || 'restaurantos-dev-2026';
function auth(req) { return req.headers['x-dev-password'] === DEV_PASSWORD; }

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });
    const snap = await adminDb.collection('staff')
      .where('restaurant_id', '==', restaurantId).get();
    return res.status(200).json({ staff: snap.docs.map(d => ({ uid: d.id, ...d.data() })) });
  }

  if (req.method === 'POST') {
    const { restaurantId, name, email, password, role } = req.body;
    if (!restaurantId || !name || !email || !password || !role)
      return res.status(400).json({ error: 'Missing fields' });
    try {
      const user = await adminAuth.createUser({ email, password, displayName: name });
      await adminDb.collection('staff').doc(user.uid).set({
        restaurant_id: restaurantId, name, email, role,
        created_at: FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ uid: user.uid });
    } catch (err) {
      if (err.code === 'auth/email-already-exists')
        return res.status(409).json({ error: 'Email already in use' });
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    try { await adminAuth.deleteUser(uid); } catch (_) {}
    await adminDb.collection('staff').doc(uid).delete();
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
