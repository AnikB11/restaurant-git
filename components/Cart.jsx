// components/Cart.jsx
import { useState } from 'react';

export default function Cart({ items, onUpdateQuantity, onUpdateNote, onSubmit, submitting }) {
  const [orderNote, setOrderNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in bg-surface/50 rounded-3xl border border-surface-variant border-dashed">
        <div className="text-6xl mb-6 opacity-40">
          <span className="material-symbols-outlined text-[64px]">shopping_cart</span>
        </div>
        <p className="font-noto-serif font-bold text-on-surface text-2xl mb-2">Cart is empty</p>
        <p className="font-body-md text-on-surface-variant text-sm">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface rounded-3xl p-5 border border-surface-variant shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <p className="font-noto-serif font-bold text-on-surface text-lg leading-tight mb-1">
                  {item.name}
                </p>
                <p className="font-body-md text-primary text-base font-bold">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-3 bg-surface-variant/50 rounded-full p-1 border border-outline-variant/30">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-surface border border-surface-variant flex items-center justify-center text-on-surface font-bold text-lg shadow-sm hover:border-primary/50 transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-[16px]">{item.quantity === 1 ? 'delete' : 'remove'}</span>
                </button>
                <span className="font-body-md font-bold text-on-surface w-4 text-center text-sm">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm transition-opacity hover:opacity-90 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            {/* Item note */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-on-surface-variant/50">edit_note</span>
              <input
                type="text"
                placeholder="Add note (e.g. less spicy)"
                value={item.notes || ''}
                onChange={(e) => onUpdateNote(item.id, e.target.value)}
                className="w-full text-sm font-body-md pl-9 pr-4 py-2.5 rounded-xl bg-surface-variant/30 border border-outline-variant/30 outline-none text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:bg-surface transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Order-level note */}
      <div className="mb-6 bg-surface p-4 rounded-2xl border border-surface-variant shadow-sm">
        {!showNoteInput ? (
          <button
            onClick={() => setShowNoteInput(true)}
            className="w-full text-sm text-primary font-label-sm flex items-center justify-center gap-2 py-2"
          >
            <span className="material-symbols-outlined text-[18px]">speaker_notes</span> Add order instructions
          </button>
        ) : (
          <div className="animate-fade-in relative">
            <span className="absolute left-3 top-3 material-symbols-outlined text-[18px] text-primary/70">speaker_notes</span>
            <textarea
              placeholder="Any special instructions for the kitchen?"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={2}
              className="w-full text-sm font-body-md pl-10 pr-4 py-3 rounded-xl bg-surface-variant/30 border border-primary/30 outline-none text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-surface resize-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Divider + Total */}
      <div className="border-t border-surface-variant pt-5 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">
              {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
            </p>
            <p className="font-noto-serif font-bold text-on-surface text-3xl">
              ₹{subtotal.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="text-xs text-on-surface-variant/70 font-body-md mb-1">excl. taxes</p>
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={() => onSubmit(orderNote)}
        disabled={submitting}
        className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label-sm text-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90"
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined animate-spin">sync</span> Sending...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[22px]">local_fire_department</span> Send to Kitchen
          </>
        )}
      </button>
    </div>
  );
}
