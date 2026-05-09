// components/FloatingActions.jsx
import { useState } from 'react';

export default function FloatingActions({
  onAddItems,
  onRequestBill,
  onCallStaff,
  billRequested,
  staffCalled,
  cartCount = 0,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      {/* Action buttons (animated in) */}
      {expanded && (
        <div className="flex flex-col items-end gap-3 animate-slide-up mb-2">
          <ActionButton
            onClick={() => { onAddItems(); setExpanded(false); }}
            label={cartCount > 0 ? `Add More (${cartCount} in cart)` : 'Add Items'}
            icon="add_shopping_cart"
            color="bg-primary text-on-primary"
          />
          <ActionButton
            onClick={() => { onCallStaff(); setExpanded(false); }}
            label={staffCalled ? 'Staff Notified ✓' : 'Call Staff'}
            icon="notifications_active"
            color="bg-secondary-container text-on-secondary-container"
            disabled={staffCalled}
          />
          <ActionButton
            onClick={() => { onRequestBill(); setExpanded(false); }}
            label={billRequested ? 'Bill Requested ✓' : 'Request Bill'}
            icon="receipt_long"
            color="bg-primary-container text-on-primary-container"
            disabled={billRequested}
          />
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-16 h-16 rounded-3xl bg-on-surface text-surface text-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 border border-outline-variant/20"
      >
        <span
          className="material-symbols-outlined transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-[32px]"
          style={{ transform: expanded ? 'rotate(135deg)' : 'rotate(0)' }}
        >
          add
        </span>
      </button>
    </div>
  );
}

function ActionButton({ onClick, label, icon, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 pr-5 pl-4 py-3.5 rounded-2xl text-sm font-label-sm shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:grayscale-[0.3] ${color}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
