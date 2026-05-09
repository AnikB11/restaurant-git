// components/BillingModal.jsx
import { useState } from 'react';
import { requestBill } from '../lib/hooks/useOrders';

const TIP_PRESETS = [
  { label: 'No Tip', value: 0 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
  { label: '18%', value: 18 },
  { label: '20%', value: 20 },
];

export default function BillingModal({ orders, onClose, onBillRequested }) {
  const [selectedTip, setSelectedTip] = useState(10);
  const [customTip, setCustomTip] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Aggregate all pending orders
  const subtotal = orders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const tipPercent = isCustom ? parseFloat(customTip) || 0 : selectedTip;
  const tipAmount = Math.round((subtotal * tipPercent) / 100);
  const total = subtotal + tipAmount;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // Request bill on each active order
      for (const order of orders) {
        if (order.payment_status === 'pending') {
          await requestBill(order.id, {
            tipPercent,
            tipAmount: Math.round((order.subtotal * tipPercent) / 100),
          });
        }
      }
      setDone(true);
      setTimeout(() => {
        onBillRequested && onBillRequested();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm bg-black/60 transition-all duration-300 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-t-[32px] bg-surface p-6 pb-12 animate-slide-up shadow-2xl border-t border-white/20"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {done ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-6 shadow-md">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>
            <h2 className="font-noto-serif font-bold text-on-surface text-3xl mb-2 tracking-tight">Bill Requested!</h2>
            <p className="font-body-md text-on-surface-variant text-center text-sm">
              A staff member will bring your bill shortly.
            </p>
          </div>
        ) : (
          <>
            {/* Handle */}
            <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mb-8" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="font-noto-serif font-bold text-on-surface text-3xl tracking-tight">
                Your Bill
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-outline-variant/30 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Order breakdown */}
            <div className="space-y-3 mb-6 bg-surface-variant/30 rounded-2xl p-4 border border-outline-variant/30">
              {orders.flatMap((order) =>
                (order.items || []).map((item, idx) => (
                  <div key={`${order.id}-${idx}`} className="flex justify-between text-sm font-body-md text-on-surface">
                    <span>
                      <span className="font-bold text-primary mr-1">{item.quantity}×</span> {item.name}
                    </span>
                    <span className="font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-surface-variant pt-5 mb-8">
              <div className="flex justify-between font-body-md text-on-surface-variant text-sm mb-2">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-body-md text-on-surface-variant text-sm mb-3">
                <span>Tip ({tipPercent}%)</span>
                <span>₹{tipAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-noto-serif font-bold text-on-surface text-2xl mt-4 pt-4 border-t border-surface-variant border-dashed">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Tip selector */}
            <div className="mb-8">
              <p className="text-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-3">Add a tip</p>
              <div className="flex gap-2 flex-wrap">
                {TIP_PRESETS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setSelectedTip(t.value); setIsCustom(false); }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-label-sm transition-all border ${
                      !isCustom && selectedTip === t.value
                        ? 'bg-primary border-primary text-on-primary shadow-md'
                        : 'bg-surface border-surface-variant text-on-surface hover:bg-surface-variant/50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  onClick={() => setIsCustom(true)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-label-sm transition-all border ${
                    isCustom
                      ? 'bg-primary border-primary text-on-primary shadow-md'
                      : 'bg-surface border-surface-variant text-on-surface hover:bg-surface-variant/50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {isCustom && (
                <div className="mt-4 relative animate-fade-in">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-sm">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter tip percentage"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-surface-variant/30 border border-primary/30 font-body-md text-sm outline-none text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:bg-surface transition-all"
                  />
                </div>
              )}
            </div>

            {/* Payment note */}
            <div className="bg-secondary-container/30 border border-secondary-container rounded-2xl p-4 mb-8 flex gap-3 items-start">
              <span className="material-symbols-outlined text-secondary text-[20px]">credit_card</span>
              <p className="text-xs font-body-md text-on-surface-variant leading-relaxed">
                Payment will be collected by staff. We accept cash, card, and UPI.
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label-sm text-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span> Requesting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span> Request Bill — ₹{total.toLocaleString('en-IN')}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
