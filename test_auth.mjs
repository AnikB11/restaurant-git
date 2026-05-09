import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth(email, pass) {
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    console.log(`SUCCESS: ${email} / ${pass}`);
  } catch (err) {
    console.log(`FAIL: ${email} / ${pass} -> ${err.code}`);
  }
}

async function run() {
  await testAuth('kitchen@saffron.com', 'kitchen123');
  await testAuth('kitchen@saffron.com', 'YOUR_PASSWORD_HERE');
  process.exit(0);
}

run();
