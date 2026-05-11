// pages/kitchen.js
import { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/hooks/useAuth';
import { useRestaurantOrders, acknowledgeStaffCall } from '../lib/hooks/useOrders';
import { useMenu } from '../lib/hooks/useMenu';
import { useNotificationSound } from '../lib/hooks/useNotificationSound';
import LoginForm from '../components/LoginForm';
import OrderCard from '../components/OrderCard';

const TABS = { ORDERS: 'orders', MENU: 'menu' };

export default function KitchenPage() {
  const { user, staffProfile, loading, error, login, logout } = useAuth();
  const [tab, setTab] = useState(TABS.ORDERS);
  const [menuCategory, setMenuCategory] = useState('All');

  const restaurantId = staffProfile?.restaurant_id;

  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurantId, {
    activeOnly: true,
  });

  const { menuItems, toggleAvailability, loading: menuLoading } = useMenu(restaurantId);

  useNotificationSound(orders);

  // ── Auth guard ─────────────────────────────────────────────────────
  if (loading) return <DarkLoader />;

  if (!user || !staffProfile) {
    return (
      <LoginForm
        onLogin={login}
        loading={loading}
        error={error}
        role="Kitchen"
      />
    );
  }

  // Verify kitchen role
  if (staffProfile && staffProfile.role !== 'kitchen' && staffProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center p-8 text-center">
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px]">block</span>
          </div>
          <p className="font-noto-serif text-3xl font-bold text-white mb-2">Access Denied</p>
          <p className="text-gray-400 font-body-md text-base">This portal is restricted to kitchen staff.</p>
          <button onClick={logout} className="mt-8 px-6 py-3 rounded-xl bg-charcoal-800 border border-white/10 text-white font-label-sm hover:bg-charcoal-800/80 transition-all">Sign out</button>
        </div>
      </div>
    );
  }

  const urgentCount = orders.filter(
    (o) => o.status === 'received'
  ).length;

  const staffCalls = orders.filter((o) => o.staff_called);

  const filteredMenu =
    menuCategory === 'All'
      ? menuItems
      : menuItems.filter((i) => i.category === menuCategory);

  const menuCategories = ['All', ...new Set(menuItems.map((i) => i.category))];

  return (
    <>
      <Head>
        <title>KDS | Restaurant OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen font-body-md bg-[#0F1115] text-white">
        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 px-8 py-5 flex justify-between items-center bg-[#0F1115]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--color-primary)/0.2)]">
              <span className="material-symbols-outlined text-[24px]">skillet</span>
            </div>
            <div>
              <h1 className="font-noto-serif font-bold text-xl tracking-tight text-white">
                Kitchen Display
              </h1>
              <p className="text-gray-400 text-xs font-label-sm uppercase tracking-wider mt-0.5">
                {staffProfile?.name || user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-label-sm px-4 py-2 rounded-full animate-pulse shadow-sm">
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                <span>{urgentCount} New Orders</span>
              </div>
            )}
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-charcoal-800 hover:bg-charcoal-800/80 border border-white/5 flex items-center justify-center text-gray-400 transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>

        {/* ── Staff call alert banner ───────────────────────────────── */}
        {staffCalls.length > 0 && (
          <div className="px-8 py-4 flex items-center justify-between bg-blue-900/20 border-b border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 bg-blue-500/10 border border-blue-500/20">
                <span className="material-symbols-outlined animate-bounce">notifications_active</span>
              </div>
              <span className="text-blue-200 font-body-md text-base font-medium">
                Waitstaff requested at Table{staffCalls.length > 1 ? 's' : ''}{' '}
                {staffCalls.map((o) => o.table_number).join(', ')}
              </span>
            </div>
            <button
              onClick={() =>
                staffCalls.forEach((o) => acknowledgeStaffCall(o.id))
              }
              className="text-blue-300 text-sm font-label-sm border border-blue-500/30 px-5 py-2.5 rounded-xl hover:bg-blue-500/20 transition-all shadow-sm"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* ── Tab nav ──────────────────────────────────────────────── */}
        <div className="flex px-8 pt-8 gap-4 sticky top-[80px] bg-[#0F1115]/90 backdrop-blur-md z-20 pb-6 border-b border-white/5">
          <TabBtn
            active={tab === TABS.ORDERS}
            onClick={() => setTab(TABS.ORDERS)}
            label="Active Orders"
            badge={orders.length}
            icon="receipt_long"
          />
          <TabBtn
            active={tab === TABS.MENU}
            onClick={() => setTab(TABS.MENU)}
            label="Menu Availability"
            icon="inventory_2"
          />
        </div>

        {/* ── ORDERS TAB ───────────────────────────────────────────── */}
        {tab === TABS.ORDERS && (
          <div className="px-8 pb-16 pt-6 animate-fade-in">
            {ordersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-[32px] bg-charcoal-800/50 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-charcoal-800/20 rounded-[32px] border border-white/5 border-dashed">
                <div className="w-24 h-24 rounded-full bg-charcoal-800 flex items-center justify-center mb-8 border border-white/5">
                  <span className="material-symbols-outlined text-5xl text-gray-500">done_all</span>
                </div>
                <p className="text-white font-noto-serif text-2xl font-bold tracking-tight mb-2">Kitchen is Clear</p>
                <p className="text-gray-400 text-base font-body-md max-w-sm">No active orders right now. Great job keeping up with the rush.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Columns by status */}
                {['received', 'preparing', 'ready'].map((status) => {
                  const group = orders.filter((o) => o.status === status);
                  return (
                    <div key={status} className="flex flex-col gap-5 bg-charcoal-900/50 rounded-[32px] p-6 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${STATUS_BG[status]} shadow-[0_0_10px_currentColor]`} />
                          <h3 className="font-noto-serif text-2xl font-bold text-white">
                            {STATUS_LABELS[status]}
                          </h3>
                        </div>
                        <span className="text-sm font-label-sm text-gray-400 bg-charcoal-800 px-3 py-1 rounded-full border border-white/5">{group.length}</span>
                      </div>
                      
                      {group.length === 0 ? (
                        <div className="h-40 rounded-[24px] border border-white/5 border-dashed flex items-center justify-center text-gray-600 text-sm font-body-md bg-charcoal-800/20">
                          No orders
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {group.map((order) => (
                            <div key={order.id} className="animate-slide-up">
                              <OrderCard order={order} variant="kitchen" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MENU TAB ─────────────────────────────────────────────── */}
        {tab === TABS.MENU && (
          <div className="px-8 pb-16 pt-6 animate-fade-in">
            {/* Category filter */}
            <div className="flex gap-3 overflow-x-auto pb-6 mb-4 no-scrollbar">
              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMenuCategory(cat)}
                  className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-label-sm transition-all duration-300 border ${
                    menuCategory === cat 
                      ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20' 
                      : 'bg-charcoal-800 border-white/5 text-gray-400 hover:text-white hover:bg-charcoal-800/80 hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 rounded-[24px] bg-charcoal-800 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenu.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-6 rounded-[24px] transition-all duration-300 border bg-charcoal-800 border-white/5 hover:border-white/10 shadow-sm hover:shadow-lg"
                    style={{ opacity: item.available ? 1 : 0.6 }}
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-noto-serif font-bold text-white text-lg truncate">
                        {item.name}
                      </p>
                      <p className="text-gray-400 text-sm font-body-md mt-1">
                        {item.category} · <span className="text-primary font-bold">₹{item.price}</span>
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleAvailability(item.id, item.available)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-label-sm transition-all border flex-shrink-0 active:scale-[0.98] ${
                        item.available
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${item.available ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'}`} />
                      {item.available ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function TabBtn({ active, onClick, label, icon, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 rounded-2xl text-sm font-label-sm flex items-center justify-center gap-2 transition-all duration-300 border ${
        active 
          ? 'bg-white text-charcoal-900 border-white shadow-lg' 
          : 'bg-charcoal-800 text-gray-400 border-white/5 hover:bg-charcoal-800/80 hover:text-white hover:border-white/10'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded-full min-w-[24px] text-center ml-1 ${
            active ? 'bg-charcoal-900 text-white' : 'bg-primary text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function DarkLoader() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <div className="w-14 h-14 rounded-full border-4 border-charcoal-800 border-t-primary animate-spin" />
    </div>
  );
}

const STATUS_BG = {
  received: 'bg-error',
  preparing: 'bg-primary',
  ready: 'bg-secondary',
};

const STATUS_LABELS = {
  received: 'New Tickets',
  preparing: 'Cooking',
  ready: 'Ready to Expedite',
};
