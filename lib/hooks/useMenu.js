// lib/hooks/useMenu.js
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export const CATEGORIES = ['Drinks', 'Starters', 'Mains', 'Desserts'];

export function useMenu(restaurantId) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, 'menu_items'),
      where('restaurant_id', '==', restaurantId),
      orderBy('category'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenuItems(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [restaurantId]);

  const toggleAvailability = async (itemId, currentValue) => {
    try {
      await updateDoc(doc(db, 'menu_items', itemId), {
        available: !currentValue,
        updated_at: new Date(),
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = menuItems.filter((item) => item.category === cat);
    return acc;
  }, {});

  return { menuItems, byCategory, loading, toggleAvailability };
}
