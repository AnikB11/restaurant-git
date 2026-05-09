// pages/dev.js — Developer Portal
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import QRCode from 'qrcode';

const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_PASSWORD || 'restaurantos-dev-2026';

function devFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-dev-password': DEV_PASSWORD, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(r => r.json());
}

const TABS = ['Restaurants', 'Menu', 'Staff', 'Tables'];

export default function DevPortal() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const [tab, setTab] = useState('Restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // --- data state per tab ---
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);

  // --- form state ---
  const [restForm, setRestForm] = useState({ name: '', tagline: '', address: '', phone: '', tableCount: 5 });
  const [menuForm, setMenuForm] = useState({ name: '', category: 'Mains', price: '', description: '', image_url: '' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'kitchen' });
  const [tableForm, setTableForm] = useState({ number: '', seats: 4 });
  const [qrMap, setQrMap] = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  function login() {
    if (pw === DEV_PASSWORD) { setAuthed(true); setPwErr(false); }
    else { setPwErr(true); }
  }

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    const data = await devFetch('/api/dev/restaurants');
    setRestaurants(data.restaurants || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) loadRestaurants(); }, [authed, loadRestaurants]);

  const loadTabData = useCallback(async () => {
    if (!selectedRest) return;
    if (tab === 'Menu') {
      const d = await devFetch(`/api/dev/menu?restaurantId=${selectedRest.id}`);
      setMenuItems(d.items || []);
    } else if (tab === 'Staff') {
      const d = await devFetch(`/api/dev/staff?restaurantId=${selectedRest.id}`);
      setStaff(d.staff || []);
    } else if (tab === 'Tables') {
      const d = await devFetch(`/api/dev/tables?restaurantId=${selectedRest.id}`);
      const tbls = d.tables || [];
      setTables(tbls);
      // Generate QR codes
      const qrs = {};
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      for (const t of tbls) {
        qrs[t.id] = await QRCode.toDataURL(`${base}/menu?token=${t.token}`, { width: 200, margin: 1 });
      }
      setQrMap(qrs);
    }
  }, [selectedRest, tab]);

  useEffect(() => { loadTabData(); }, [loadTabData]);

  // --- CREATE RESTAURANT ---
  async function createRestaurant(e) {
    e.preventDefault();
    setLoading(true);
    const d = await devFetch('/api/dev/restaurants', { method: 'POST', body: restForm });
    if (d.restaurantId) { showToast('Restaurant created!'); setRestForm({ name: '', tagline: '', address: '', phone: '', tableCount: 5 }); await loadRestaurants(); }
    else showToast('Error: ' + d.error);
    setLoading(false);
  }

  async function deleteRestaurant(id) {
    if (!confirm('Delete this restaurant and ALL its data?')) return;
    await devFetch('/api/dev/restaurants', { method: 'DELETE', body: { restaurantId: id } });
    if (selectedRest?.id === id) setSelectedRest(null);
    showToast('Deleted'); await loadRestaurants();
  }

  // --- MENU ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { // 1MB limit for firestore document sizing
      showToast('Image must be under 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setMenuForm(p => ({ ...p, image_url: reader.result }));
    reader.readAsDataURL(file);
  };

  async function addMenuItem(e) {
    e.preventDefault();
    const d = await devFetch('/api/dev/menu', { method: 'POST', body: { ...menuForm, restaurantId: selectedRest.id } });
    if (d.id) { showToast('Item added!'); setMenuForm({ name: '', category: 'Mains', price: '', description: '', image_url: '' }); await loadTabData(); }
    else showToast('Error: ' + d.error);
  }

  async function deleteMenuItem(itemId) {
    await devFetch('/api/dev/menu', { method: 'DELETE', body: { itemId } });
    showToast('Deleted'); await loadTabData();
  }

  // --- STAFF ---
  async function addStaff(e) {
    e.preventDefault();
    const d = await devFetch('/api/dev/staff', { method: 'POST', body: { ...staffForm, restaurantId: selectedRest.id } });
    if (d.uid) { showToast('Staff created!'); setStaffForm({ name: '', email: '', password: '', role: 'kitchen' }); await loadTabData(); }
    else showToast('Error: ' + d.error);
  }

  async function deleteStaff(uid) {
    await devFetch('/api/dev/staff', { method: 'DELETE', body: { uid } });
    showToast('Deleted'); await loadTabData();
  }

  // --- TABLES ---
  async function addTable(e) {
    e.preventDefault();
    const d = await devFetch('/api/dev/tables', { method: 'POST', body: { ...tableForm, restaurantId: selectedRest.id } });
    if (d.id) { showToast('Table added!'); setTableForm({ number: '', seats: 4 }); await loadTabData(); }
    else showToast('Error: ' + d.error);
  }

  async function deleteTable(tableId) {
    await devFetch('/api/dev/tables', { method: 'DELETE', body: { tableId } });
    showToast('Deleted'); await loadTabData();
  }

  // ── PASSWORD GATE ──────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
      <Head><title>Dev Portal — Restaurant OS</title></Head>
      <div className="w-full max-w-sm bg-[#12121e] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-violet-400 text-[32px]">terminal</span>
          </div>
          <h1 className="text-white font-noto-serif text-3xl font-bold">Dev Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Restaurant OS Administrator</p>
        </div>
        <div className="space-y-4">
          <input
            type="password" placeholder="Enter dev password" value={pw}
            onChange={e => { setPw(e.target.value); setPwErr(false); }}
            onKeyDown={e => e.key === 'Enter' && login()}
            className={`w-full bg-white/5 border text-white px-4 py-3 rounded-xl outline-none text-sm placeholder:text-gray-600 focus:border-violet-500 transition-colors ${pwErr ? 'border-red-500' : 'border-white/10'}`}
          />
          {pwErr && <p className="text-red-400 text-xs">Incorrect password</p>}
          <button onClick={login} className="w-full py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors">
            Access Portal
          </button>
        </div>
      </div>
    </div>
  );

  // ── MAIN PORTAL ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <Head><title>Dev Portal — Restaurant OS</title></Head>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-violet-600 text-white px-5 py-3 rounded-xl text-sm shadow-xl animate-slide-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center justify-between bg-[#0d0d1a]/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-violet-400">terminal</span>
          <span className="font-bold text-lg">Restaurant OS — Dev Portal</span>
        </div>
        <button onClick={() => setAuthed(false)} className="text-gray-500 text-sm hover:text-white transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">logout</span> Sign out
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar — restaurants list */}
        <div className="w-72 border-r border-white/10 p-5 flex flex-col gap-4 bg-[#0d0d1a]/50 shrink-0">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Restaurants</p>

          {/* Create restaurant form */}
          <form onSubmit={createRestaurant} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <p className="text-xs text-violet-300 font-semibold mb-1">New Restaurant</p>
            {[['name','Name*'],['tagline','Tagline'],['address','Address'],['phone','Phone']].map(([k,ph]) => (
              <input key={k} placeholder={ph} value={restForm[k]} required={k==='name'}
                onChange={e => setRestForm(p => ({...p,[k]:e.target.value}))}
                className="w-full bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none placeholder:text-gray-600 focus:border-violet-500"
              />
            ))}
            <input type="number" min="1" max="50" placeholder="No. of Tables*" value={restForm.tableCount}
              onChange={e => setRestForm(p => ({...p, tableCount: e.target.value}))}
              className="w-full bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none placeholder:text-gray-600 focus:border-violet-500"
            />
            <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Creating...' : '+ Create'}
            </button>
          </form>

          {/* Restaurant list */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {restaurants.map(r => (
              <div key={r.id}
                onClick={() => { setSelectedRest(r); setTab('Menu'); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all group ${selectedRest?.id === r.id ? 'bg-violet-600/20 border-violet-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{r.address || 'No address'}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteRestaurant(r.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && !loading && (
              <p className="text-gray-600 text-xs text-center py-4">No restaurants yet</p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {!selectedRest ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
              <span className="material-symbols-outlined text-6xl mb-4">storefront</span>
              <p className="text-lg">Select or create a restaurant</p>
            </div>
          ) : (
            <>
              {/* Restaurant header */}
              <div className="mb-6">
                <h2 className="font-noto-serif font-bold text-3xl">{selectedRest.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedRest.id}</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* ── MENU TAB ── */}
              {tab === 'Menu' && (
                <div>
                  <form onSubmit={addMenuItem} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-3">
                    <input placeholder="Item name*" value={menuForm.name} required
                      onChange={e => setMenuForm(p => ({...p, name: e.target.value}))}
                      className="col-span-2 bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                    />
                    <select value={menuForm.category} onChange={e => setMenuForm(p => ({...p, category: e.target.value}))}
                      className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-violet-500">
                      {['Drinks','Starters','Mains','Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input placeholder="Price (₹)*" type="number" min="0" value={menuForm.price} required
                      onChange={e => setMenuForm(p => ({...p, price: e.target.value}))}
                      className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                    />
                    <div className="col-span-2 flex items-center gap-3">
                      <label className="flex-1 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm px-4 py-2.5 rounded-xl transition-colors text-center border-dashed">
                        {menuForm.image_url ? 'Change Image' : 'Upload Image (Max 1MB)'}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {menuForm.image_url && (
                        <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden shrink-0 border border-white/20">
                          <img src={menuForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <input placeholder="Description" value={menuForm.description}
                      onChange={e => setMenuForm(p => ({...p, description: e.target.value}))}
                      className="col-span-2 bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                    />
                    <button type="submit" className="col-span-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                      + Add Menu Item
                    </button>
                  </form>
                  <div className="space-y-2">
                    {['Drinks','Starters','Mains','Desserts'].map(cat => {
                      const catItems = menuItems.filter(i => i.category === cat);
                      if (!catItems.length) return null;
                      return (
                        <div key={cat}>
                          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">{cat}</p>
                          {catItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2 group">
                              <div className="flex items-center gap-4">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-black/20" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center text-gray-500">
                                    <span className="material-symbols-outlined text-[20px]">image</span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold">{item.name}</p>
                                  <p className="text-gray-500 text-xs">{item.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-violet-300 font-bold text-sm">₹{item.price}</span>
                                <button onClick={() => deleteMenuItem(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {menuItems.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No menu items yet</p>}
                  </div>
                </div>
              )}

              {/* ── STAFF TAB ── */}
              {tab === 'Staff' && (
                <div>
                  <form onSubmit={addStaff} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-3">
                    <input placeholder="Full name*" value={staffForm.name} required
                      onChange={e => setStaffForm(p => ({...p, name: e.target.value}))}
                      className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                    />
                    <select value={staffForm.role} onChange={e => setStaffForm(p => ({...p, role: e.target.value}))}
                      className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-violet-500">
                      <option value="kitchen">Kitchen</option>
                      <option value="counter">Counter</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input placeholder="Email*" type="email" value={staffForm.email} required
                      onChange={e => setStaffForm(p => ({...p, email: e.target.value}))}
                      className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                    />
                    <input placeholder="Password*" type="password" value={staffForm.password} required
                      onChange={e => setStaffForm(p => ({...p, password: e.target.value}))}
                      className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                    />
                    <button type="submit" className="col-span-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                      + Create Staff Account
                    </button>
                  </form>
                  <div className="space-y-2">
                    {staff.map(s => (
                      <div key={s.uid} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 group">
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-gray-500 text-xs">{s.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            s.role === 'kitchen' ? 'bg-orange-500/20 text-orange-300' :
                            s.role === 'counter' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'
                          }`}>{s.role}</span>
                          <button onClick={() => deleteStaff(s.uid)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {staff.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No staff yet</p>}
                  </div>
                </div>
              )}

              {/* ── TABLES TAB ── */}
              {tab === 'Tables' && (
                <div>
                  <form onSubmit={addTable} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Table Number*</label>
                      <input placeholder="e.g. 6" type="number" min="1" value={tableForm.number} required
                        onChange={e => setTableForm(p => ({...p, number: e.target.value}))}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Seats</label>
                      <input placeholder="4" type="number" min="1" value={tableForm.seats}
                        onChange={e => setTableForm(p => ({...p, seats: e.target.value}))}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none placeholder:text-gray-600 focus:border-violet-500"
                      />
                    </div>
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors whitespace-nowrap">
                      + Add Table
                    </button>
                  </form>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map(t => (
                      <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">Table {t.number}</p>
                            <p className="text-gray-500 text-xs">{t.seats} seats</p>
                          </div>
                          <button onClick={() => deleteTable(t.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        {qrMap[t.id] && (
                          <img src={qrMap[t.id]} alt={`QR Table ${t.number}`} className="w-full rounded-xl bg-white p-1 mb-3" />
                        )}
                        <p className="text-[10px] text-gray-600 break-all font-mono">{t.token}</p>
                        <a href={`/menu?token=${t.token}`} target="_blank" rel="noreferrer"
                          className="mt-3 w-full text-center block text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-lg py-1.5 transition-colors">
                          Open Guest Menu →
                        </a>
                        <button
                          onClick={() => {
                            const base = window.location.origin;
                            const a = document.createElement('a');
                            a.href = qrMap[t.id];
                            a.download = `Table_${t.number}_QR.png`;
                            a.click();
                          }}
                          className="mt-2 w-full text-center block text-xs text-gray-500 hover:text-gray-300 border border-white/10 rounded-lg py-1.5 transition-colors">
                          ↓ Download QR
                        </button>
                      </div>
                    ))}
                    {tables.length === 0 && <p className="text-gray-600 text-sm text-center py-8 col-span-3">No tables yet</p>}
                  </div>
                </div>
              )}

              {/* ── RESTAURANTS TAB (overview) ── */}
              {tab === 'Restaurants' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Restaurant Details</p>
                  {[['Name', selectedRest.name], ['Tagline', selectedRest.tagline], ['Address', selectedRest.address], ['Phone', selectedRest.phone], ['ID', selectedRest.id]].map(([l, v]) => (
                    <div key={l} className="flex gap-4 py-2 border-b border-white/5 last:border-0">
                      <span className="text-gray-500 text-sm w-20 shrink-0">{l}</span>
                      <span className="text-sm font-mono text-gray-200">{v || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
