// scripts/add-images.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const imageMap = {
  "Butter Chicken": "/images/menu/butter_chicken.png",
  "Biryani (Chicken)": "/images/menu/chicken_biryani.png",
  "Dal Makhani": "/images/menu/dal_makhani.png",
  "Paneer Tikka": "/images/menu/paneer_tikka.png",
  "Samosa (2 pcs)": "/images/menu/samosa.png",
  "Masala Chai": "/images/menu/masala_chai.png",
  "Mango Lassi": "/images/menu/mango_lassi.png",
  "Veg Thali": "/images/menu/veg_thali.png",
  "Lamb Rogan Josh": "/images/menu/lamb_rogan_josh.png",
  "Gulab Jamun": "/images/menu/gulab_jamun.png",
  "Garlic Naan": "/images/menu/garlic_naan.png",
  "Palak Paneer": "/images/menu/palak_paneer.png",
  "Rasmalai": "/images/menu/rasmalai.png",
  "Fresh Lime Soda": "/images/menu/fresh_lime_soda.png",
  "Veg Spring Rolls": "/images/menu/veg_spring_rolls.png",
  "Virgin Mojito": "/images/menu/virgin_mojito.png",
  "Cold Coffee": "/images/menu/cold_coffee.png",
};

async function updateImages() {
  try {
    const snapshot = await db.collection('menu_items').get();
    const batch = db.batch();
    let updatedCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (imageMap[data.name]) {
        batch.update(doc.ref, { image_url: imageMap[data.name] });
        updatedCount++;
        console.log(`Setting image for ${data.name} to ${imageMap[data.name]}`);
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updatedCount} menu items with images.`);
    } else {
      console.log('No matching menu items found to update.');
    }
  } catch (error) {
    console.error('Error updating images:', error);
  } finally {
    process.exit(0);
  }
}

updateImages();

