// lib/hooks/useOrders.js
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';

export const ORDER_STATUS = {
  RECEIVED: 'received',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  PAID: 'paid',
};

export const STATUS_LABELS = {
  received: 'Order Received',
  preparing: 'Preparing',
  ready: 'Ready to Serve!',
  delivered: 'Delivered',
  paid: 'Paid',
};

export const STATUS_COLORS = {
  received: '#f59e0b',
  preparing: '#3b82f6',
  ready: '#10b981',
  delivered: '#6b7280',
  paid: '#6b7280',
};

// ── Guest: place a new order ───────────────────────────────────────────
export async function placeOrder({ restaurantId, tableId, tableNumber, items, notes }) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const orderRef = await addDoc(collection(db, 'orders'), {
    restaurant_id: restaurantId,
    table_id: tableId,
    table_number: tableNumber,
    status: ORDER_STATUS.RECEIVED,
    items: items.map((i) => ({
      menu_item_id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      notes: i.notes || '',
    })),
    subtotal: total,
    tip: 0,
    tip_percent: 0,
    total: total,
    notes: notes || '',
    bill_requested: false,
    staff_called: false,
    payment_status: 'pending',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return orderRef.id;
}

// ── Guest: watch a specific order ─────────────────────────────────────
export function useGuestOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [orderId]);

  return { order, loading };
}

// ── Guest: watch ALL orders for a table (for session continuity) ──────
export function useTableOrders(restaurantId, tableId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId || !tableId) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurant_id', '==', restaurantId),
      where('table_id', '==', tableId),
      where('payment_status', '==', 'pending'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [restaurantId, tableId]);

  return { orders, loading };
}

// ── Kitchen / Counter: watch all active orders for a restaurant ───────
export function useRestaurantOrders(restaurantId, { activeOnly = false } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    let q = query(
      collection(db, 'orders'),
      where('restaurant_id', '==', restaurantId),
      orderBy('created_at', 'desc')
    );

    if (activeOnly) {
      q = query(
        collection(db, 'orders'),
        where('restaurant_id', '==', restaurantId),
        where('status', 'in', [ORDER_STATUS.RECEIVED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY]),
        orderBy('created_at', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [restaurantId, activeOnly]);

  return { orders, loading };
}

// ── Update order status ────────────────────────────────────────────────
export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    updated_at: serverTimestamp(),
  });
}

// ── Request bill ───────────────────────────────────────────────────────
export async function requestBill(orderId, { tipPercent, tipAmount }) {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    bill_requested: true,
    tip_percent: tipPercent,
    tip: tipAmount,
    updated_at: serverTimestamp(),
  });
}

// ── Call staff ─────────────────────────────────────────────────────────
export async function callStaff(orderId) {
  await updateDoc(doc(db, 'orders', orderId), {
    staff_called: true,
    staff_called_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

// ── Mark payment complete ──────────────────────────────────────────────
export async function markPaymentComplete(orderId) {
  await updateDoc(doc(db, 'orders', orderId), {
    payment_status: 'paid',
    status: ORDER_STATUS.PAID,
    paid_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

// ── Acknowledge staff call ─────────────────────────────────────────────
export async function acknowledgeStaffCall(orderId) {
  await updateDoc(doc(db, 'orders', orderId), {
    staff_called: false,
    updated_at: serverTimestamp(),
  });
}

// ── Shift table request ──────────────────────────────────────────────
export async function requestTableShift(orderId, newTableNumber) {
  await updateDoc(doc(db, 'orders', orderId), {
    shift_requested: Number(newTableNumber),
    updated_at: serverTimestamp(),
  });
}

// ── Reject shift table request ───────────────────────────────────────
export async function rejectTableShift(orderId) {
  await updateDoc(doc(db, 'orders', orderId), {
    shift_requested: null,
    updated_at: serverTimestamp(),
  });
}

// ── Approve and execute shift table ──────────────────────────────────
export async function shiftTable(restaurantId, currentTableId, newTableNumber) {
  // 1. Get the new table doc by its number
  const qTable = query(
    collection(db, 'tables'),
    where('restaurant_id', '==', restaurantId),
    where('number', '==', Number(newTableNumber)),
    limit(1)
  );
  const snapTable = await getDocs(qTable);
  if (snapTable.empty) {
    throw new Error('Table not found');
  }
  const newTable = { id: snapTable.docs[0].id, ...snapTable.docs[0].data() };

  // 2. Get all pending orders for the current table
  const qOrders = query(
    collection(db, 'orders'),
    where('restaurant_id', '==', restaurantId),
    where('table_id', '==', currentTableId),
    where('payment_status', '==', 'pending')
  );
  const snapOrders = await getDocs(qOrders);

  // 3. Update them to the new table
  await Promise.all(snapOrders.docs.map(docSnap => 
    updateDoc(doc(db, 'orders', docSnap.id), {
      table_id: newTable.id,
      table_number: newTable.number,
      shift_requested: null,
      updated_at: serverTimestamp()
    })
  ));

  return newTable;
}
