// pages/premium.js
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/hooks/useAuth';
import LoginForm from '../components/LoginForm';

// Uses devFetch for simplicity in this demo, assuming premium users have an API key or use auth
function apiFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-dev-password': process.env.NEXT_PUBLIC_DEV_PASSWORD || 'restaurantos-dev-2026', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(r => r.json());
}

const TABS = ['Analytics', 'Menu Management', 'Settings', 'Support'];

export default function PremiumDashboard() {
  const { user, staffProfile, loading: authLoading, error: authError, login, logout } = useAuth();
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [tab, setTab] = useState('Analytics');
  const [loading, setLoading] = useState(false);
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  
  // Menu State
  const [menuItems, setMenuItems] = useState([]);

  // Load restaurants (Multi-restaurant support)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiFetch('/api/dev/restaurants')
      .then(data => {
        // In a real app, filter by owner ID. Here we just show all or a subset for the demo.
        setRestaurants(data.restaurants || []);
        if (data.restaurants?.length > 0) {
          setSelectedRest(data.restaurants[0]);
        }
        setLoading(false);
      });
  }, [user]);

  // Load Tab Data
  const loadTabData = useCallback(async () => {
    if (!selectedRest) return;
    setLoading(true);
    try {
      if (tab === 'Analytics') {
        const d = await apiFetch(`/api/dev/analytics?restaurantId=${selectedRest.id}`);
        setAnalytics(d);
      } else if (tab === 'Menu Management') {
        const d = await apiFetch(`/api/dev/menu?restaurantId=${selectedRest.id}`);
        setMenuItems(d.items || []);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }, [selectedRest, tab]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const toggleAvailability = async (item) => {
    // We update via a generic api endpoint or directly, but since we don't have an update endpoint in api/dev/menu
    // Let's assume we use the firebase client for this specific action to match kitchen.js
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    try {
      await updateDoc(doc(db, 'menu_items', item.id), {
        available: !item.available
      });
      // Optimistic update
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !item.available } : i));
    } catch(e) {
      console.error(e);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-14 h-14 rounded-full border-4 border-surface-variant border-t-primary animate-spin" /></div>;
  if (!user) return <LoginForm onLogin={login} loading={authLoading} error={authError} role="Premium Manager" />;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white font-body-md">
      <Head><title>Premium Dashboard | Restaurant OS</title></Head>

      {/* Header */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center justify-between bg-[#0d0d1a]/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
          </div>
          <div>
            <span className="font-bold text-lg font-noto-serif block leading-none">Premium OS</span>
            <span className="text-xs text-amber-400/80 font-label-sm uppercase tracking-wider">Enterprise Edition</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Multi-restaurant Selector */}
          <select 
            value={selectedRest?.id || ''} 
            onChange={(e) => setSelectedRest(restaurants.find(r => r.id === e.target.value))}
            className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2 rounded-xl outline-none focus:border-amber-500 appearance-none"
          >
            {restaurants.map(r => <option key={r.id} value={r.id} className="bg-[#0d0d1a]">{r.name}</option>)}
          </select>
          
          <button onClick={logout} className="text-gray-500 text-sm hover:text-white transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">logout</span> Sign out
          </button>
        </div>
      </div>

      <div className="flex px-8 pt-8 gap-4 sticky top-[73px] bg-[#0a0a12]/90 backdrop-blur-md z-30 pb-6 border-b border-white/5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 rounded-2xl text-sm font-label-sm transition-all border ${tab === t ? 'bg-amber-500 text-[#0a0a12] border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {loading && <div className="text-center py-12 text-amber-500/50 animate-pulse">Loading data...</div>}
        
        {!loading && tab === 'Analytics' && analytics && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-noto-serif font-bold">Advanced Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value={`₹${analytics.overview.totalRevenue.toLocaleString()}`} icon="payments" color="text-green-400" bg="bg-green-400/10" border="border-green-400/20" />
              <StatCard title="Total Orders" value={analytics.overview.totalOrders} icon="receipt_long" color="text-amber-400" bg="bg-amber-400/10" border="border-amber-400/20" />
              <StatCard title="Avg Order Value" value={`₹${analytics.overview.avgOrderValue.toLocaleString()}`} icon="analytics" color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
              <StatCard title="Total Tips" value={`₹${analytics.overview.totalTips.toLocaleString()}`} icon="volunteer_activism" color="text-purple-400" bg="bg-purple-400/10" border="border-purple-400/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">trending_up</span> Sales Trend (Last 7 Days)</h3>
                <div className="space-y-4">
                  {analytics.dailyRevenue.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="w-16 text-gray-400 text-sm">{d.day}</span>
                      <div className="flex-1 mx-4 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.max(5, (d.revenue / (Math.max(...analytics.dailyRevenue.map(r=>r.revenue))||1)) * 100)}%` }} />
                      </div>
                      <span className="w-20 text-right font-mono text-sm">₹{d.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">star</span> Top Selling Items</h3>
                <div className="space-y-4">
                  {analytics.topItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold">{i+1}</span>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-amber-400">₹{item.revenue.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.count} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">table_restaurant</span> Table Utilization</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {analytics.tableUtilization.map((t, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                           <div className="text-2xl font-bold mb-1">T{t.number}</div>
                           <div className="text-xs text-gray-400 mb-2">{t.seats} seats</div>
                           <div className="text-sm text-amber-400 font-semibold">₹{t.revenue.toLocaleString()}</div>
                        </div>
                     ))}
                  </div>
               </div>
               
               <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">schedule</span> Peak Hours</h3>
                  <div className="flex items-end justify-between h-48 pt-8 border-b border-white/10 relative">
                     {analytics.peakHours.sort((a,b)=>a.hour-b.hour).map((ph, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-1/6">
                           <div className="w-full bg-amber-500/50 rounded-t-md hover:bg-amber-400 transition-colors relative group" style={{ height: `${(ph.count / (Math.max(...analytics.peakHours.map(p=>p.count))||1)) * 100}%` }}>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100">{ph.count} orders</div>
                           </div>
                           <div className="text-xs text-gray-400">{ph.hour}:00</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {!loading && tab === 'Menu Management' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-noto-serif font-bold">Menu & Availability</h2>
              <div className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">photo_camera</span> Interactive Photo Menu Active
              </div>
            </div>
            <p className="text-gray-400">Instantly toggle item availability across all digital menus and KDS.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-6 rounded-[24px] bg-white/5 border border-white/10 transition-all hover:border-white/20">
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.category} • ₹{item.price}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.available !== false ? 'bg-amber-500' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.available !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === 'Settings' && (
          <div className="space-y-8 animate-fade-in max-w-2xl">
            <h2 className="text-3xl font-noto-serif font-bold">Premium Settings</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
               <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                     <h3 className="font-bold text-lg">Guided Ordering Experience</h3>
                     <p className="text-sm text-gray-400 mt-1">Prompt guests for water preference and specials upon seating.</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-amber-500 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                  </button>
               </div>
               
               <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                     <h3 className="font-bold text-lg">AI Menu Recommendations</h3>
                     <p className="text-sm text-gray-400 mt-1">Suggest complementary items during checkout.</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-amber-500 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                  </button>
               </div>

               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="font-bold text-lg">Multi-Language Menu</h3>
                     <p className="text-sm text-gray-400 mt-1">Auto-translate menu to guest's phone language.</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-amber-500 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                  </button>
               </div>
            </div>
          </div>
        )}

        {!loading && tab === 'Support' && (
          <div className="space-y-8 animate-fade-in max-w-4xl">
            <h2 className="text-3xl font-noto-serif font-bold">Priority Support</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30 rounded-[32px] p-8">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6 border border-amber-500/30 text-amber-400">
                     <span className="material-symbols-outlined text-3xl">support_agent</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Dedicated Account Manager</h3>
                  <p className="text-gray-400 mb-6">Your personal contact for strategy, setup, and scaling.</p>
                  
                  <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                     <div className="flex items-center gap-4">
                        <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=c8853a&color=fff" className="w-12 h-12 rounded-full" />
                        <div>
                           <div className="font-bold text-lg">Sarah Jenkins</div>
                           <div className="text-amber-400 text-sm">Senior Success Manager</div>
                        </div>
                     </div>
                     <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                        <a href="mailto:sarah.j@restaurantos.com" className="flex items-center gap-2 text-sm hover:text-amber-400 transition-colors"><span className="material-symbols-outlined text-[18px]">mail</span> sarah.j@restaurantos.com</a>
                        <a href="tel:+18005550199" className="flex items-center gap-2 text-sm hover:text-amber-400 transition-colors"><span className="material-symbols-outlined text-[18px]">call</span> +1 (800) 555-0199 ext 42</a>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                     <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">flash_on</span> Priority Support Line</h3>
                     <p className="text-gray-400 text-sm mb-4">24/7 direct access to our tier-2 engineering team.</p>
                     <div className="text-2xl font-mono font-bold tracking-wider">1-888-REST-VIP</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                     <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">schedule</span> 1-Hour SLA</h3>
                     <p className="text-gray-400 text-sm mb-4">Guaranteed response time for all email tickets.</p>
                     <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-bold text-sm border border-white/10">Submit Urgent Ticket</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg, border }) {
  return (
    <div className={`p-6 rounded-[24px] bg-white/5 border border-white/10 transition-transform hover:-translate-y-1`}>
      <div className={`w-12 h-12 rounded-xl ${bg} ${color} ${border} border flex items-center justify-center mb-4`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1 font-noto-serif">{value}</div>
      <div className="text-gray-400 text-sm font-label-sm uppercase tracking-wider">{title}</div>
    </div>
  );
}
