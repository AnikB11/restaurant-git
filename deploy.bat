@echo off
echo Removing existing variables...
npx vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY production --yes
npx vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production --yes
npx vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID production --yes
npx vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production --yes
npx vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production --yes
npx vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID production --yes
npx vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production --yes
npx vercel env rm NEXT_PUBLIC_DEV_PASSWORD production --yes

echo Adding correct variables...
echo AIzaSyA7MGraxLjjcW5YyykDaGMAhveX8lPB38g| npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo restaurant-102fe.firebaseapp.com| npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo restaurant-102fe| npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo restaurant-102fe.firebasestorage.app| npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo 417156010895| npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo 1:417156010895:web:11b73db0f6f8e0850e31fa| npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo G-ZWT0JEQ1SX| npx vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production
echo restaurantos-dev-2026| npx vercel env add NEXT_PUBLIC_DEV_PASSWORD production

echo Deploying...
npx vercel --prod --yes
