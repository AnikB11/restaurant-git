// pages/api/staff.js — Create & delete staff accounts (Firebase Admin)
import { adminAuth, adminDb } from '../../lib/firebaseAdmin';

const DEV_PASSWORD = process.env.DEV_PORTAL_PASSWORD || 'restaurantos-dev-2026';

export default async function handler(req, res) {
  // Verify dev password header
  if (req.headers['x-dev-password'] !== DEV_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { email, password, name, role, restaurantId } = req.body;
    if (!email || !password || !name || !role || !restaurantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
      await adminDb.collection('staff').doc(userRecord.uid).set({
        restaurant_id: restaurantId,
        name,
        email,
        role,
        created_at: new Date(),
      });
      return res.status(201).json({ uid: userRecord.uid });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    try {
      await adminAuth.deleteUser(uid);
      await adminDb.collection('staff').doc(uid).delete();
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
