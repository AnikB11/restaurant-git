// scripts/reset-passwords.js
// Run with: node scripts/reset-passwords.js
// Forcefully resets staff account passwords via firebase-admin (bypasses Auth)

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();

const staffMembers = [
  { email: 'kitchen@saffron.com', password: 'YOUR_PASSWORD_HERE' },
  { email: 'counter@saffron.com', password: 'YOUR_PASSWORD_HERE' },
  { email: 'admin@saffron.com',   password: 'YOUR_PASSWORD_HERE' },
];

async function resetPasswords() {
  console.log('🔑 Resetting staff passwords...\n');

  for (const staff of staffMembers) {
    try {
      // Look up user by email
      const user = await auth.getUserByEmail(staff.email);
      // Force-update the password
      await auth.updateUser(user.uid, { password: staff.password });
      console.log(`✅ Reset: ${staff.email} → ${staff.password}`);
    } catch (err) {
      console.error(`❌ Failed for ${staff.email}:`, err.message);
    }
  }

  console.log('\n🎉 Done! Try logging in again.');
  process.exit(0);
}

resetPasswords().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
