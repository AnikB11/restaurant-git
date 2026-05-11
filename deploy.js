const { execSync } = require('child_process');
const fs = require('fs');

const envs = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyA7MGraxLjjcW5YyykDaGMAhveX8lPB38g',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'restaurant-102fe.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'restaurant-102fe',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'restaurant-102fe.firebasestorage.app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '417156010895',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:417156010895:web:11b73db0f6f8e0850e31fa',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-ZWT0JEQ1SX',
  NEXT_PUBLIC_DEV_PASSWORD: 'restaurantos-dev-2026'
};

for (const [k, v] of Object.entries(envs)) {
  try {
    console.log(`Removing ${k}...`);
    execSync(`npx vercel env rm ${k} production --yes`, { stdio: 'ignore' });
  } catch (e) {}
  
  try {
    console.log(`Adding ${k}...`);
    execSync(`npx vercel env add ${k} production`, { input: v });
  } catch (e) {
    console.error(`Failed to add ${k}`, e.message);
  }
}

console.log('Deploying...');
execSync('npx vercel --prod --yes', { stdio: 'inherit' });
