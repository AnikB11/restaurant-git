// pages/menu.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMenu, CATEGORIES } from '../lib/hooks/useMenu';
import { useTableOrders, placeOrder, callStaff, updateOrderStatus } from '../lib/hooks/useOrders';
import MenuCard from '../components/MenuCard';
import Cart from '../components/Cart';
import OrderTracking from '../components/OrderTracking';
import FloatingActions from '../components/FloatingActions';
import BillingModal from '../components/BillingModal';

const VIEWS = {
  WELCOME: 'welcome',
  DRINKS_GUIDE: 'drinks_guide',
  MENU: 'menu',
  CART: 'cart',
  TRACKING: 'tracking',
};

export default function MenuPage() {
  const router = useRouter();
  const { token, tableId: queryTableId } = router.query;

  // Session state
  const [tableData, setTableData] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loadingTable, setLoadingTable] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  // UI state
  const [view, setView] = useState(VIEWS.WELCOME);
  const [activeCategory, setActiveCategory] = useState('Mains');
  const [cartItems, setCartItems] = useState([]);
  const [showBilling, setShowBilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Firestore data
  const restaurantId = restaurant?.id;
  const tableId = tableData?.id;
  const { byCategory, loading: menuLoading } = useMenu(restaurantId);
  const { orders } = useTableOrders(restaurantId, tableId);

  // ── Auto-skip welcome if guest already has active orders ─────────────
  useEffect(() => {
    if (orders.length > 0 && (view === VIEWS.WELCOME || view === VIEWS.DRINKS_GUIDE)) {
      setView(VIEWS.MENU);
    }
  }, [orders, view]);

  // ── Resolve token or tableId → table + restaurant ──────────────────────────────
  useEffect(() => {
    if (!token && !queryTableId) return;

    async function resolveTable() {
      try {
        let tableSnapDoc;
        
        if (token) {
          const q = query(
            collection(db, 'tables'),
            where('token', '==', token),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            tableSnapDoc = snap.docs[0];
          }
        } else if (queryTableId) {
          // Fallback to tableId for local testing
          const docRef = doc(db, 'tables', queryTableId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            tableSnapDoc = docSnap;
          } else {
            // Also try to query by 'number' if they passed a number
            const q = query(
              collection(db, 'tables'),
              where('number', '==', Number(queryTableId)),
              limit(1)
            );
            const numSnap = await getDocs(q);
            if (!numSnap.empty) {
              tableSnapDoc = numSnap.docs[0];
            }
          }
        }

        if (!tableSnapDoc) { 
          setTokenError(true); 
          setLoadingTable(false); 
          return; 
        }

        const table = { id: tableSnapDoc.id, ...tableSnapDoc.data() };
        setTableData(table);

        const restSnap = await getDoc(doc(db, 'restaurants', table.restaurant_id));
        if (restSnap.exists()) {
          setRestaurant({ id: restSnap.id, ...restSnap.data() });
        }
      } catch (err) {
        console.error(err);
        setTokenError(true);
      } finally {
        setLoadingTable(false);
      }
    }

    resolveTable();
  }, [token, queryTableId]);

  // ── Cart operations ──────────────────────────────────────────────────
  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (itemId, qty) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const updateNote = (itemId, note) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, notes: note } : i))
    );
  };

  // ── Submit order ─────────────────────────────────────────────────────
  const handleSubmitOrder = async (orderNote) => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      await placeOrder({
        restaurantId,
        tableId,
        tableNumber: tableData.number,
        items: cartItems,
        notes: orderNote,
      });
      setCartItems([]);
      setView(VIEWS.TRACKING);
    } catch (err) {
      console.error('Order failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Floating action handlers ─────────────────────────────────────────
  const handleCallStaff = async () => {
    if (!orders.length) return;
    const activeOrder = orders.find(
      (o) => o.payment_status === 'pending' && !o.staff_called
    );
    if (activeOrder) await callStaff(activeOrder.id);
  };

  const hasActiveOrders = orders.some((o) => o.payment_status === 'pending');
  const billAlreadyRequested = orders.every((o) => o.bill_requested);
  const staffAlreadyCalled = orders.some((o) => o.staff_called);

  // ── Loading / Error states ───────────────────────────────────────────
  if (!token && !queryTableId) {
    return <ErrorScreen message="No table token provided." detail="Please scan the QR code at your table." />;
  }
  if (loadingTable) {
    return <LoadingScreen />;
  }
  if (tokenError || !tableData) {
    return <ErrorScreen message="Invalid QR code." detail="Please ask your server for assistance." />;
  }

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <Head>
        <title>{restaurant?.name || 'Restaurant'} — Table {tableData.number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-background font-body-md text-on-surface">
        {/* ── WELCOME ── */}
        {view === VIEWS.WELCOME && (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-surface-container-low animate-fade-in relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-container rounded-full blur-[100px] opacity-20 pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary-container rounded-full blur-[100px] opacity-20 pointer-events-none" />
            
            <div className="text-6xl mb-8 relative z-10 animate-slide-up">
              <span className="material-symbols-outlined text-6xl text-primary font-light">restaurant_menu</span>
            </div>
            <h1 className="font-noto-serif text-5xl font-bold text-on-surface tracking-tight mb-4 relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {restaurant?.name || 'Welcome'}
            </h1>
            <p className="text-primary font-body-md text-lg mb-4 relative z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {restaurant?.tagline || 'Fine Dining Experience'}
            </p>
            <div className="inline-block bg-surface rounded-3xl px-8 py-5 mb-12 mt-6 shadow-sm border border-surface-variant relative z-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-on-surface-variant text-sm font-label-sm uppercase tracking-wider mb-1">You are seated at</p>
              <p className="font-noto-serif font-bold text-primary text-4xl">
                Table {tableData.number}
              </p>
            </div>
            <button
              onClick={() => setView(VIEWS.DRINKS_GUIDE)}
              className="w-full max-w-sm py-5 rounded-2xl bg-primary text-on-primary font-label-sm text-lg transition-all active:scale-[0.98] hover:opacity-90 shadow-xl shadow-primary/20 relative z-10 animate-slide-up flex items-center justify-center gap-3"
              style={{ animationDelay: '0.4s' }}
            >
              Start Order <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ── WATER PREFERENCE ── */}
        {view === VIEWS.DRINKS_GUIDE && (
          <div className="min-h-screen flex flex-col p-6 bg-surface-container-low animate-fade-in">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-5xl text-center mb-8">
                <span className="material-symbols-outlined text-6xl text-secondary">water_drop</span>
              </div>
              <h2 className="font-noto-serif text-4xl font-bold text-on-surface text-center mb-4 tracking-tight">
                Water Preference?
              </h2>
              <p className="text-on-surface-variant font-body-md text-center mb-10 text-base max-w-xs mx-auto">
                How would you like your water served while you browse the menu?
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {['Normal', 'Cold', 'Hot', 'Mineral'].map((temp) => (
                  <button
                    key={temp}
                    onClick={async () => {
                      const waterItem = {
                        id: `water-${temp.toLowerCase()}`,
                        name: `${temp} Water`,
                        price: temp === 'Mineral' ? 40 : 0,
                        category: 'Drinks',
                        quantity: 1,
                        notes: 'Water Preference'
                      };
                      try {
                        const orderId = await placeOrder({
                          restaurantId,
                          tableId,
                          tableNumber: tableData.number,
                          items: [waterItem],
                          notes: 'Guest requested water upon seating',
                        });
                        await updateOrderStatus(orderId, 'delivered');
                        await callStaff(orderId);
                      } catch (err) {
                        console.error('Failed to request water:', err);
                      }
                      setActiveCategory('Mains');
                      setView(VIEWS.MENU);
                    }}
                    className="flex flex-col items-center justify-center p-6 rounded-3xl text-center transition-all border-2 bg-surface border-surface-variant text-on-surface hover:border-primary/50 hover:shadow-md hover:bg-primary/5 active:scale-[0.98]"
                  >
                    <span className="text-4xl mb-3">
                      <span className="material-symbols-outlined text-primary text-[40px]">
                        {temp === 'Hot' ? 'local_fire_department' : temp === 'Mineral' ? 'water_bottle' : temp === 'Cold' ? 'ac_unit' : 'water_drop'}
                      </span>
                    </span>
                    <p className="font-label-sm text-base">{temp}</p>
                    {temp === 'Mineral' && <p className="font-body-md text-xs text-on-surface-variant mt-1 flex items-center justify-center gap-1"><span className="text-primary font-bold">₹40</span></p>}
                    {temp !== 'Mineral' && <p className="font-body-md text-[11px] text-on-surface-variant uppercase tracking-wider mt-1.5">Free</p>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => { setActiveCategory('Mains'); setView(VIEWS.MENU); }}
                className="w-full py-4 rounded-2xl font-label-sm text-base text-on-surface-variant bg-surface border border-surface-variant flex items-center justify-center gap-2 hover:bg-surface-variant/50 transition-colors"
              >
                Skip water for now
              </button>
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        {view === VIEWS.MENU && (
          <div className="pb-32 bg-background min-h-screen animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-surface-variant pt-safe">
              <div className="px-6 pt-5 pb-3">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h1 className="font-noto-serif font-bold text-on-surface text-2xl tracking-tight">
                      {restaurant?.name}
                    </h1>
                    <p className="text-on-surface-variant text-sm font-label-sm mt-1 uppercase tracking-wider">Table {tableData.number}</p>
                  </div>
                  {/* Cart button */}
                  {cartCount > 0 && (
                    <button
                      onClick={() => setView(VIEWS.CART)}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary font-label-sm text-sm relative shadow-md hover:opacity-90 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                      <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                    </button>
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-label-sm transition-all border ${
                        activeCategory === cat 
                          ? 'bg-on-surface text-surface border-on-surface shadow-md' 
                          : 'bg-surface text-on-surface-variant border-surface-variant hover:bg-surface-variant/50'
                      }`}
                    >
                      <span className="mr-2">{CAT_EMOJI[cat]}</span> {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Items grid */}
            <div className="px-6 pt-6">
              {menuLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 rounded-3xl bg-surface-variant animate-pulse" />
                  ))}
                </div>
              ) : (byCategory[activeCategory] || []).length === 0 ? (
                <div className="text-center py-20 bg-surface/50 rounded-3xl border border-surface-variant border-dashed">
                  <div className="text-5xl mb-4 opacity-50">{CAT_EMOJI[activeCategory]}</div>
                  <p className="text-on-surface-variant font-body-md text-sm">No items available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(byCategory[activeCategory] || []).map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onAdd={addToCart}
                      cartQuantity={
                        cartItems.find((c) => c.id === item.id)?.quantity || 0
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tracking strip (if active orders) */}
            {hasActiveOrders && (
              <div className="px-6 mt-8">
                <button
                  onClick={() => setView(VIEWS.TRACKING)}
                  className="w-full py-4 rounded-2xl font-label-sm text-sm flex items-center justify-between px-6 bg-tertiary-container text-on-tertiary-container border border-tertiary/20 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">room_service</span> Track your order
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CART ── */}
        {view === VIEWS.CART && (
          <div className="min-h-screen flex flex-col bg-background animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-surface-variant z-10">
              <div className="px-6 py-5 flex items-center gap-4">
                <button
                  onClick={() => setView(VIEWS.MENU)}
                  className="w-10 h-10 rounded-full bg-surface border border-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="font-noto-serif font-bold text-on-surface text-2xl">
                  Your Order
                </h2>
              </div>
            </div>

            <div className="flex-1 px-6 py-6 overflow-y-auto">
              <Cart
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onUpdateNote={updateNote}
                onSubmit={handleSubmitOrder}
                submitting={submitting}
              />
            </div>
          </div>
        )}

        {/* ── TRACKING ── */}
        {view === VIEWS.TRACKING && (
          <div className="min-h-screen flex flex-col bg-background animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-surface-variant z-10">
              <div className="px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setView(VIEWS.MENU)}
                    className="w-10 h-10 rounded-full bg-surface border border-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-variant/50 transition-colors"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h2 className="font-noto-serif font-bold text-on-surface text-2xl">
                    Order Status
                  </h2>
                </div>
                {cartCount > 0 && (
                  <button
                    onClick={() => setView(VIEWS.CART)}
                    className="text-primary text-sm font-label-sm px-4 py-2 bg-primary-container/30 rounded-full hover:bg-primary-container/50 transition-colors"
                  >
                    Cart ({cartCount})
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 px-6 py-6">
              <OrderTracking orders={orders.filter((o) => o.payment_status === 'pending')} />

              {orders.length === 0 && (
                <div className="text-center py-24 bg-surface/50 rounded-3xl border border-surface-variant border-dashed mt-4">
                  <span className="material-symbols-outlined text-6xl text-outline-variant mb-6">receipt_long</span>
                  <p className="font-noto-serif text-on-surface text-xl font-bold">No active orders</p>
                  <p className="font-body-md text-on-surface-variant text-sm mt-2">Ready to order?</p>
                  <button
                    onClick={() => setView(VIEWS.MENU)}
                    className="mt-6 text-primary font-label-sm text-sm px-6 py-3 border border-primary/20 rounded-xl bg-surface hover:bg-primary-container/20 transition-all"
                  >
                    Browse menu
                  </button>
                </div>
              )}

              {/* Add more button */}
              {orders.length > 0 && (
                <button
                  onClick={() => setView(VIEWS.MENU)}
                  className="mt-8 w-full py-4 rounded-2xl font-label-sm text-base transition-all bg-surface border-2 border-primary text-primary hover:bg-primary-container/20 flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span> Add More Items
                </button>
              )}
            </div>
          </div>
        )}

        {/* Floating actions (shown on menu + tracking) */}
        {(view === VIEWS.MENU || view === VIEWS.TRACKING) && hasActiveOrders && (
          <FloatingActions
            onAddItems={() => setView(VIEWS.MENU)}
            onRequestBill={() => setShowBilling(true)}
            onCallStaff={handleCallStaff}
            billRequested={billAlreadyRequested}
            staffCalled={staffAlreadyCalled}
            cartCount={cartCount}
          />
        )}

        {/* Billing modal */}
        {showBilling && (
          <BillingModal
            orders={orders.filter((o) => o.payment_status === 'pending')}
            onClose={() => setShowBilling(false)}
            onBillRequested={() => setShowBilling(false)}
          />
        )}
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function QuickDrinkCard({ item, selected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center justify-center p-6 rounded-3xl text-center transition-all border-2 ${
        selected 
          ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20' 
          : 'bg-surface border-surface-variant text-on-surface hover:border-outline-variant hover:shadow-md'
      }`}
    >
      <span className="text-4xl mb-4">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover mx-auto" />
        ) : (
          <span className={`material-symbols-outlined text-4xl ${selected ? 'text-on-primary' : 'text-primary'}`}>local_bar</span>
        )}
      </span>
      <p className="font-label-sm text-sm leading-tight">{item.name}</p>
      <p
        className={`font-body-md text-sm mt-1.5 ${selected ? 'text-on-primary/80' : 'text-on-surface-variant'}`}
      >
        ₹{item.price}
      </p>
      {selected && <span className="text-white mt-3 text-[11px] font-label-sm bg-black/20 px-3 py-1 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check</span> Added</span>}
    </button>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="w-14 h-14 rounded-full border-4 border-surface-variant border-t-primary animate-spin" />
      <p className="font-label-sm text-on-surface-variant text-sm uppercase tracking-widest">Loading your table…</p>
    </div>
  );
}

function ErrorScreen({ message, detail }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="mb-6 bg-error-container text-on-error-container w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md">
        <span className="material-symbols-outlined text-4xl">warning</span>
      </div>
      <h2 className="font-noto-serif font-bold text-on-surface text-3xl mb-3 tracking-tight">{message}</h2>
      <p className="font-body-md text-on-surface-variant text-base">{detail}</p>
    </div>
  );
}

const CAT_EMOJI = {
  Drinks: '🥤',
  Starters: '🍢',
  Mains: '🍽️',
  Desserts: '🍮',
};
