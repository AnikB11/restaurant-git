import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import QRCode from 'qrcode';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const [tables, setTables] = useState([]);
  const [qrMap, setQrMap] = useState({});

  useEffect(() => {
    async function loadTables() {
      try {
        const snap = await getDocs(query(collection(db, 'tables'), orderBy('number')));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Deduplicate by table number (handles multiple seed runs)
        const seen = new Map();
        all.forEach(t => { if (!seen.has(t.number)) seen.set(t.number, t); });
        const uniqueTables = [...seen.values()];
        setTables(uniqueTables);

        // Generate QR codes
        const qrs = {};
        const base = window.location.origin;
        for (const t of uniqueTables) {
          qrs[t.id] = await QRCode.toDataURL(`${base}/menu?tableId=${t.number}`, { width: 200, margin: 1 });
        }
        setQrMap(qrs);
      } catch (err) {
        console.error(err);
      }
    }
    loadTables();
  }, []);

  return (
    <>
      <Head>
        <title>Restaurant OS — Staff Portal</title>
      </Head>
      <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface transition-colors duration-500">
        <div className="text-center mb-16 animate-slide-up">
          <div className="w-20 h-20 bg-surface-variant/50 border border-outline-variant/30 rounded-[32px] mx-auto mb-6 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[40px] text-primary">restaurant</span>
          </div>
          <h1 className="font-noto-serif text-5xl font-bold mb-3 tracking-tight">
            Restaurant OS
          </h1>
          <p className="text-on-surface-variant font-label-sm uppercase tracking-[0.2em] text-sm">
            Smart Operating System
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link href="/premium">
            <button className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-label-sm text-lg hover:shadow-xl hover:shadow-amber-500/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-between group border border-amber-600">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
                <span>Premium OS</span>
              </div>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </Link>
          <Link href="/kitchen">
            <button className="w-full py-5 px-6 rounded-3xl bg-charcoal-900 text-surface font-label-sm text-lg hover:shadow-xl hover:shadow-charcoal-900/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-between group border border-charcoal-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">skillet</span>
                <span>Kitchen Dashboard</span>
              </div>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </Link>
          <Link href="/counter">
            <button className="w-full py-5 px-6 rounded-3xl bg-primary text-on-primary font-label-sm text-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-between group border border-primary/20">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">storefront</span>
                <span>Reception / Cashier</span>
              </div>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </Link>
        </div>

        <div className="mt-16 p-6 bg-surface-variant/30 rounded-3xl border border-outline-variant/30 max-w-sm w-full animate-fade-in shadow-sm" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            Guest Menu Access (Demo)
          </p>
          
          {tables.length === 0 ? (
            <div className="animate-pulse flex gap-3 flex-wrap">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 w-[47%] bg-surface-variant/50 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tables.map(table => (
                <Link key={table.id} href={`/menu?tableId=${table.number}`}>
                  <button className="w-full p-4 rounded-xl bg-surface border border-outline-variant/50 hover:border-primary group transition-colors shadow-sm active:scale-95 flex flex-col items-center justify-center">
                    {qrMap[table.id] ? (
                      <img src={qrMap[table.id]} alt={`Table ${table.number} QR`} className="w-24 h-24 mb-3 rounded-lg border border-outline-variant/20 bg-white" />
                    ) : (
                      <div className="w-24 h-24 mb-3 bg-surface-variant/50 rounded-lg animate-pulse" />
                    )}
                    <span className="text-on-surface font-label-sm group-hover:text-primary transition-colors">Table {table.number}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
