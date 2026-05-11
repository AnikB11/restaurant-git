// pages/counter.js
import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/hooks/useAuth';
import { useRestaurantOrders, markPaymentComplete, acknowledgeStaffCall } from '../lib/hooks/useOrders';
import { useNotificationSound } from '../lib/hooks/useNotificationSound';
import LoginForm from '../components/LoginForm';
import OrderCard from '../components/OrderCard';

const TABS = { TABLES: 'tables', ORDERS: 'orders', REVENUE: 'revenue' };

export default function CounterPage() {
  const { user, staffProfile, loading, error, login, logout } = useAuth();
  const [tab, setTab] = useState(TABS.TABLES);
  const [selectedTable, setSelectedTable] = useState(null);

  const restaurantId = staffProfile?.restaurant_id;
  const { orders, loading: ordersLoading } = useRestaurantOrders(restaurantId);

  useNotificationSound(orders);

  // ── Auth guard ──────────────────────────────────────────────────────
  if (loading) return <LightLoader />;
  if (!user) return <LoginForm onLogin={login} loading={loading} error={error} role="Counter" />;

  if (staffProfile && staffProfile.role !== 'counter' && staffProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-8 text-center">
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px]">block</span>
          </div>
          <p className="font-noto-serif text-3xl font-bold text-on-surface mb-2">Access Denied</p>
          <p className="text-on-surface-variant font-body-md text-base">This portal is restricted to reception staff.</p>
          <button onClick={logout} className="mt-8 px-6 py-3 rounded-xl bg-surface-variant text-on-surface font-label-sm hover:bg-surface-variant/80 transition-all">Sign out</button>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────
  const activeOrders = orders.filter((o) => o.payment_status === 'pending');
  const paidOrders = orders.filter((o) => o.payment_status === 'paid');

  // Group active orders by table
  const tableMap = activeOrders.reduce((acc, order) => {
    const key = order.table_number;
    if (!acc[key]) acc[key] = { tableNumber: key, orders: [], tableId: order.table_id };
    acc[key].orders.push(order);
    return acc;
  }, {});

  const tables = Object.values(tableMap).sort((a, b) => a.tableNumber - b.tableNumber);

  // Revenue
  const todayRevenue = paidOrders.reduce((s, o) => s + (o.total || o.subtotal || 0), 0);
  const pendingRevenue = activeOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const avgOrder = paidOrders.length
    ? Math.round(todayRevenue / paidOrders.length)
    : 0;

  // Alerts
  const billRequests = activeOrders.filter((o) => o.bill_requested && o.payment_status === 'pending');
  const staffCalls = activeOrders.filter((o) => o.staff_called);

  const selectedTableOrders = selectedTable
    ? (tableMap[selectedTable]?.orders || [])
    : [];

  const handleMarkPaid = async (orderId) => {
    await markPaymentComplete(orderId);
  };

  return (
    <>
      <Head>
        <title>Counter | Restaurant OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-surface font-body-md text-on-surface">
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl px-8 py-5 flex justify-between items-center border-b border-surface-variant/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            <div>
              <h1 className="font-noto-serif font-bold text-on-surface text-xl tracking-tight">Counter</h1>
              <p className="text-on-surface-variant text-xs font-label-sm uppercase tracking-wider mt-0.5">{staffProfile?.name || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {activeOrders.length > 0 && (
              <div className="text-xs font-label-sm px-4 py-2 rounded-full bg-surface-variant border border-outline-variant/30 text-on-surface flex items-center gap-2 shadow-sm animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {activeOrders.length} Active Orders
              </div>
            )}
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-surface hover:bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-on-surface-variant transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>

        {/* ── Alert banners ────────────────────────────────────────── */}
        <div className="px-8 pt-6 flex flex-col gap-4">
          {billRequests.length > 0 && (
            <AlertBanner
              color="text-primary"
              bg="bg-primary/10"
              border="border-primary/20"
              icon="receipt_long"
              message={`Bill requested at Table${billRequests.length > 1 ? 's' : ''}: ${[...new Set(billRequests.map((o) => o.table_number))].join(', ')}`}
            />
          )}
          {staffCalls.length > 0 && (
            <AlertBanner
              color="text-error"
              bg="bg-error/10"
              border="border-error/20"
              icon="notifications_active"
              message={`Staff assistance needed at Table${staffCalls.length > 1 ? 's' : ''}: ${[...new Set(staffCalls.map((o) => o.table_number))].join(', ')}`}
              onDismiss={() => staffCalls.forEach((o) => acknowledgeStaffCall(o.id))}
            />
          )}
        </div>

        {/* ── Tab nav ─────────────────────────────────────────────── */}
        <div className="flex px-8 pt-8 gap-4 sticky top-[80px] bg-surface/90 backdrop-blur-md z-20 pb-6 border-b border-surface-variant/30">
          <CounterTab active={tab === TABS.TABLES} onClick={() => { setTab(TABS.TABLES); setSelectedTable(null); }} label="Tables" icon="deck" badge={tables.length} />
          <CounterTab active={tab === TABS.ORDERS} onClick={() => { setTab(TABS.ORDERS); setSelectedTable(null); }} label="Orders" icon="list_alt" badge={activeOrders.length} />
          <CounterTab active={tab === TABS.REVENUE} onClick={() => { setTab(TABS.REVENUE); setSelectedTable(null); }} label="Revenue" icon="monitoring" />
        </div>

        {/* ── TABLES TAB ──────────────────────────────────────────── */}
        {tab === TABS.TABLES && !selectedTable && (
          <div className="px-8 pb-16 pt-6 animate-fade-in">
            {tables.length === 0 ? (
              <EmptyState icon="deck" title="No active tables" sub="When guests order, their tables will appear here." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tables.map((t, i) => (
                  <TableTile
                    key={t.tableNumber}
                    table={t}
                    delay={i * 0.05}
                    onClick={() => setSelectedTable(t.tableNumber)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TABLE DETAIL ────────────────────────────────────────── */}
        {tab === TABS.TABLES && selectedTable && (
          <div className="px-8 pb-16 pt-6 animate-slide-up">
            <button
              onClick={() => setSelectedTable(null)}
              className="flex items-center gap-2 text-on-surface-variant font-label-sm mb-8 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back to Overview
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center mb-6 border-b border-surface-variant pb-6">
                  <div>
                    <h2 className="font-noto-serif font-bold text-on-surface text-4xl">
                      Table {selectedTable}
                    </h2>
                    <p className="text-on-surface-variant font-label-sm uppercase tracking-wider text-sm mt-2">
                      {selectedTableOrders.length} active order{selectedTableOrders.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedTableOrders.map((order) => (
                    <OrderCard key={order.id} order={order} variant="counter" />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-[180px]">
                  <BillSummaryCard
                    orders={selectedTableOrders}
                    onMarkPaid={handleMarkPaid}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ALL ORDERS TAB ──────────────────────────────────────── */}
        {tab === TABS.ORDERS && (
          <div className="px-8 pb-16 pt-6 animate-fade-in">
            <div className="space-y-12">
              {['received', 'preparing', 'ready', 'delivered'].map((status) => {
                const group = activeOrders.filter((o) => o.status === status);
                if (group.length === 0) return null;
                return (
                  <div key={status} className="animate-slide-up">
                    <div className="flex items-center gap-3 mb-6">
                      <span className={`w-3 h-3 rounded-full ${STATUS_BG[status]}`} />
                      <h3 className="font-noto-serif text-2xl font-bold text-on-surface">
                        {STATUS_LABELS[status]}
                      </h3>
                      <span className="ml-2 font-body-md text-sm text-on-surface-variant bg-surface-variant px-3 py-1 rounded-full">
                        {group.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.map((order) => (
                        <div key={order.id} className="bg-surface rounded-3xl border border-surface-variant/60 p-1 shadow-sm hover:shadow-md transition-shadow">
                          <OrderCard order={order} variant="counter" />
                          {order.bill_requested && order.payment_status === 'pending' && (
                            <div className="p-3 pt-0">
                              <button
                                onClick={() => handleMarkPaid(order.id)}
                                className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                                Clear Bill (₹{((order.subtotal || 0) + (order.tip || 0)).toLocaleString('en-IN')})
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {activeOrders.length === 0 && (
                <EmptyState icon="receipt_long" title="No active orders" sub="Orders will appear here automatically." />
              )}
            </div>
          </div>
        )}

        {/* ── REVENUE TAB ─────────────────────────────────────────── */}
        {tab === TABS.REVENUE && (
          <div className="px-8 pb-16 pt-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <RevenueCard
                label="Today's Revenue"
                value={`₹${todayRevenue.toLocaleString('en-IN')}`}
                sub={`${paidOrders.length} paid orders`}
                color="text-primary"
                bg="bg-primary/5"
                border="border-primary/20"
                icon="account_balance_wallet"
              />
              <RevenueCard
                label="Pending"
                value={`₹${pendingRevenue.toLocaleString('en-IN')}`}
                sub={`${activeOrders.length} active orders`}
                color="text-secondary"
                bg="bg-secondary/5"
                border="border-secondary/20"
                icon="pending_actions"
              />
              <RevenueCard
                label="Avg. Order"
                value={`₹${avgOrder.toLocaleString('en-IN')}`}
                sub="per order today"
                color="text-on-surface"
                bg="bg-surface"
                border="border-surface-variant"
                icon="analytics"
              />
              <RevenueCard
                label="Active Tables"
                value={tables.length}
                sub="occupied right now"
                color="text-on-surface-variant"
                bg="bg-surface"
                border="border-surface-variant"
                icon="deck"
              />
            </div>

            <h3 className="font-noto-serif font-bold text-on-surface text-3xl mb-8">
              Recent Transactions
            </h3>
            {paidOrders.length === 0 ? (
              <p className="text-on-surface-variant font-body-md py-12">No transactions recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paidOrders.slice(0, 20).map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-6 bg-surface rounded-3xl border border-surface-variant/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-variant/50 flex items-center justify-center text-on-surface border border-outline-variant/30">
                        <span className="material-symbols-outlined">receipt</span>
                      </div>
                      <div>
                        <p className="font-label-sm text-on-surface text-lg">
                          Table {order.table_number}
                        </p>
                        <p className="text-on-surface-variant text-sm font-body-md mt-1">
                          {formatTime(order.paid_at || order.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="font-noto-serif font-bold text-primary text-2xl">
                      ₹{((order.subtotal || 0) + (order.tip || 0)).toLocaleString('en-IN')}
                    </p>
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

// ── Sub-components ─────────────────────────────────────────────────────

function TableTile({ table, onClick, delay = 0 }) {
  const total = table.orders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const billPending = table.orders.some((o) => o.bill_requested);
  const staffCalled = table.orders.some((o) => o.staff_called);

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden bg-surface rounded-[32px] p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] border-2 animate-slide-up ${
        billPending 
          ? 'border-primary shadow-[0_8px_30px_rgb(var(--color-primary)/0.15)]' 
          : staffCalled 
            ? 'border-error shadow-[0_8px_30px_rgb(var(--color-error)/0.15)]' 
            : 'border-surface-variant shadow-sm'
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      {(billPending || staffCalled) && (
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-[40px] ${billPending ? 'bg-primary/20' : 'bg-error/20'}`} />
      )}
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <p className="text-on-surface-variant text-xs font-label-sm uppercase tracking-widest mb-2">Table</p>
          <p className="font-noto-serif font-bold text-on-surface text-6xl leading-none">
            {table.tableNumber}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {billPending && (
            <span className="text-xs text-primary font-label-sm bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">receipt_long</span> Bill Req
            </span>
          )}
          {staffCalled && (
            <span className="text-xs text-error font-label-sm bg-error/10 border border-error/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="material-symbols-outlined text-[14px]">pan_tool</span> Staff
            </span>
          )}
        </div>
      </div>
      
      <div className="relative z-10 border-t border-outline-variant/30 pt-6 flex justify-between items-end">
        <div>
          <p className="text-on-surface-variant text-sm font-label-sm mb-1">
            {table.orders.length} Order{table.orders.length !== 1 ? 's' : ''}
          </p>
          <p className="font-body-md text-on-surface text-sm">
            Pending Payment
          </p>
        </div>
        <p className="font-noto-serif font-bold text-primary text-3xl tracking-tight">
          ₹{total.toLocaleString('en-IN')}
        </p>
      </div>
    </button>
  );
}

function BillSummaryCard({ orders, onMarkPaid }) {
  const subtotal = orders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const tip = orders.reduce((s, o) => s + (o.tip || 0), 0);
  const total = subtotal + tip;
  const allBillRequested = orders.length > 0 && orders.every((o) => o.bill_requested);

  return (
    <div className="bg-surface rounded-[32px] p-8 border border-surface-variant shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center text-on-surface">
          <span className="material-symbols-outlined">receipt_long</span>
        </div>
        <h3 className="font-noto-serif font-bold text-on-surface text-2xl">
          Checkout
        </h3>
      </div>
      
      <div className="space-y-4 text-base font-body-md mb-8">
        <div className="flex justify-between text-on-surface-variant border-b border-surface-variant/50 pb-4">
          <span>Subtotal</span>
          <span className="font-semibold text-on-surface">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between text-on-surface-variant border-b border-surface-variant/50 pb-4">
            <span>Tip</span>
            <span className="font-semibold text-on-surface">₹{tip.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-4">
          <span className="font-label-sm uppercase tracking-wider text-sm text-on-surface-variant">Total Due</span>
          <span className="font-noto-serif font-bold text-primary text-4xl">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {allBillRequested ? (
        <button
          onClick={() => orders.forEach((o) => onMarkPaid(o.id))}
          className="w-full py-5 rounded-2xl bg-primary text-on-primary font-label-sm text-lg hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined">task_alt</span>
          Clear Bill
        </button>
      ) : (
        <div className="w-full py-5 rounded-2xl bg-surface-variant/30 text-on-surface-variant border border-outline-variant/30 text-center font-label-sm text-sm flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[24px]">hourglass_empty</span>
          Waiting for guest request
        </div>
      )}
    </div>
  );
}

function RevenueCard({ label, value, sub, color, bg, border, icon }) {
  return (
    <div className={`rounded-[32px] p-8 border ${border} ${bg} relative overflow-hidden transition-all hover:shadow-md`}>
      <span className={`material-symbols-outlined text-[32px] mb-6 block ${color}`}>{icon}</span>
      <p className="font-noto-serif font-bold text-on-surface text-4xl mb-2">{value}</p>
      <p className="text-on-surface-variant text-sm font-body-md mb-6">{sub}</p>
      <p className={`font-label-sm text-sm uppercase tracking-wider ${color}`}>
        {label}
      </p>
    </div>
  );
}

function CounterTab({ active, onClick, label, icon, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 rounded-2xl text-sm font-label-sm flex items-center justify-center gap-2 transition-all duration-300 border ${
        active 
          ? 'bg-on-surface text-surface border-on-surface shadow-md' 
          : 'bg-surface text-on-surface-variant border-surface-variant hover:bg-surface-variant/50'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded-full min-w-[24px] text-center ml-1 ${
            active ? 'bg-surface text-on-surface' : 'bg-primary text-on-primary'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function AlertBanner({ color, bg, border, icon, message, onDismiss }) {
  return (
    <div className={`px-6 py-5 rounded-2xl flex items-center justify-between border ${bg} ${border} animate-slide-up shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} bg-white/50 border ${border}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className={`font-body-md text-base font-medium ${color}`}>
          {message}
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`text-sm font-label-sm border px-5 py-2.5 rounded-xl transition-colors hover:bg-white/40 ${color} ${border}`}
        >
          Resolve
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-surface-variant/20 rounded-[32px] border border-outline-variant/30 border-dashed">
      <div className="w-24 h-24 rounded-full bg-surface-variant/50 flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">{icon}</span>
      </div>
      <p className="font-noto-serif text-on-surface text-2xl font-bold tracking-tight mb-2">{title}</p>
      <p className="font-body-md text-on-surface-variant text-base max-w-sm">{sub}</p>
    </div>
  );
}

function LightLoader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-14 h-14 rounded-full border-4 border-surface-variant border-t-primary animate-spin" />
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_BG = {
  received: 'bg-error',
  preparing: 'bg-primary',
  ready: 'bg-secondary',
  delivered: 'bg-on-surface-variant',
};

const STATUS_LABELS = {
  received: 'New Orders',
  preparing: 'In Progress',
  ready: 'Ready to Serve',
  delivered: 'Delivered',
};

