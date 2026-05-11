// components/OrderCard.jsx
import { updateOrderStatus, ORDER_STATUS } from '../lib/hooks/useOrders';
import { useState } from 'react';

const NEXT_STATUS = {
  received: { label: 'Start Cooking', next: ORDER_STATUS.PREPARING, color: 'bg-primary text-on-primary', border: 'border-primary shadow-[0_0_15px_rgba(var(--color-primary)/0.2)]' },
  preparing: { label: 'Mark Ready', next: ORDER_STATUS.READY, color: 'bg-secondary text-on-secondary', border: 'border-secondary shadow-[0_0_15px_rgba(var(--color-secondary)/0.2)]' },
  ready: { label: 'Mark Delivered', next: ORDER_STATUS.DELIVERED, color: 'bg-charcoal-800 text-gray-400 hover:text-white', border: 'border-white/10 hover:border-white/20' },
};

const STATUS_BG = {
  received: 'bg-error',
  preparing: 'bg-primary',
  ready: 'bg-secondary',
  delivered: 'bg-on-surface-variant',
};

export default function OrderCard({ order, variant = 'kitchen' }) {
  const [updating, setUpdating] = useState(false);
  const elapsed = getElapsed(order.created_at);
  let nextAction = null;
  if (variant === 'kitchen') {
    if (order.status === 'received') nextAction = NEXT_STATUS.received;
    if (order.status === 'preparing') nextAction = NEXT_STATUS.preparing;
  } else if (variant === 'counter') {
    if (order.status === 'ready') nextAction = NEXT_STATUS.ready;
  }

  const handleStatusUpdate = async () => {
    if (!nextAction) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, nextAction.next);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const isUrgent = elapsed > 15 && order.status === 'received';

  if (variant === 'kitchen') {
    return (
      <div
        className={`rounded-[24px] overflow-hidden transition-all bg-charcoal-800 border ${isUrgent ? 'border-error shadow-[0_0_20px_rgba(var(--color-error)/0.2)]' : 'border-white/5 hover:border-white/10 hover:shadow-lg'}`}
      >
        {/* Card header */}
        <div className="px-6 py-5 flex justify-between items-start border-b border-white/5 bg-white/[0.02]">
          <div>
            <p className="font-noto-serif font-bold text-3xl text-white">
              Table {order.table_number}
            </p>
            <p className="text-gray-400 text-sm font-body-md mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {elapsed} min ago · {order.items?.reduce((s, i) => s + i.quantity, 0)} items
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isUrgent && (
              <div className="text-error text-xs font-label-sm px-3 py-1.5 bg-error/10 rounded-full flex items-center gap-1.5 animate-pulse border border-error/20 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">warning</span> URGENT
              </div>
            )}
            {order.bill_requested && (
              <div className="text-primary text-xs font-label-sm px-3 py-1.5 bg-primary/10 rounded-full flex items-center gap-1.5 border border-primary/20">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span> Bill Req.
              </div>
            )}
            {order.staff_called && (
              <div className="text-blue-400 text-xs font-label-sm px-3 py-1.5 bg-blue-500/10 rounded-full flex items-center gap-1.5 animate-pulse border border-blue-500/20">
                <span className="material-symbols-outlined text-[14px]">notifications_active</span> Staff
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-5 space-y-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <div>
                <span className="text-white font-body-md font-medium text-lg flex items-baseline gap-3">
                  <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 text-base">{item.quantity}×</span> {item.name}
                </span>
                {item.notes && (
                  <p className="text-yellow-400/90 text-sm font-body-md mt-2 flex items-start gap-1.5 bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                    <span className="material-symbols-outlined text-[16px] mt-0.5">edit_note</span>
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}

          {order.notes && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex gap-3 shadow-sm">
              <span className="material-symbols-outlined text-yellow-400 text-[20px]">speaker_notes</span>
              <p className="text-yellow-200 text-sm font-body-md pt-0.5">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        {nextAction && (
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className={`w-full py-4 rounded-xl font-label-sm text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 border ${nextAction.color} ${nextAction.border}`}
            >
              {updating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span> Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    {order.status === 'received' ? 'local_fire_department' : order.status === 'preparing' ? 'task_alt' : 'done_all'}
                  </span>
                  {nextAction.label}
                </>
              )}
            </button>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="px-6 pb-6 pt-2">
            <div className="w-full py-4 rounded-xl font-label-sm text-base bg-white/5 text-gray-400 flex justify-center items-center gap-2 border border-white/10">
              <span className="material-symbols-outlined">done_all</span> Delivered
            </div>
          </div>
        )}
      </div>
    );
  }

  // Counter variant (adapted for new dark mode Counter portal)
  return (
    <div className="p-5 bg-transparent transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-noto-serif font-bold text-white text-xl flex items-center gap-2">
            Table {order.table_number}
          </p>
          <p className="text-gray-400 text-sm font-body-md mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">schedule</span> {elapsed} min ago
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-noto-serif font-bold text-primary text-xl">
            ₹{order.total?.toLocaleString('en-IN') || order.subtotal?.toLocaleString('en-IN')}
          </span>
          <span className={`text-[10px] font-label-sm uppercase tracking-wider px-2 py-1 rounded-md bg-white/5 text-gray-300 flex items-center gap-1.5 border border-white/10`}>
            <span className={`w-2 h-2 rounded-full ${STATUS_BG[order.status]} ${order.status !== 'delivered' && 'shadow-[0_0_8px_currentColor]'}`} />
            {order.status}
          </span>
        </div>
      </div>

      <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
        <div className="flex flex-wrap gap-2.5">
          {order.items?.map((item, idx) => (
            <span key={idx} className="text-sm font-body-md bg-charcoal-800 text-gray-200 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <span className="font-bold text-primary mr-1">{item.quantity}×</span> {item.name}
            </span>
          ))}
        </div>
        
        {(order.bill_requested || order.staff_called) && (
          <div className="flex gap-2.5 mt-4">
            {order.bill_requested && (
              <span className="text-[11px] text-primary bg-primary/10 px-3 py-1.5 rounded-full font-label-sm flex items-center gap-1.5 border border-primary/20">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span> Bill Requested
              </span>
            )}
            {order.staff_called && (
              <span className="text-[11px] text-error bg-error/10 px-3 py-1.5 rounded-full font-label-sm flex items-center gap-1.5 animate-pulse border border-error/20">
                <span className="material-symbols-outlined text-[14px]">pan_tool</span> Staff Called
              </span>
            )}
          </div>
        )}

        {nextAction && (
          <div className="mt-4">
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className={`w-full py-3 rounded-xl font-label-sm text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 border ${nextAction.color} ${nextAction.border}`}
            >
              {updating ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  {nextAction.label}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getElapsed(timestamp) {
  if (!timestamp) return 0;
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((Date.now() - date.getTime()) / 60000);
}
