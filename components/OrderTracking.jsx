// components/OrderTracking.jsx
import { STATUS_LABELS, STATUS_COLORS } from '../lib/hooks/useOrders';

const STEPS = ['received', 'preparing', 'ready', 'delivered'];

export default function OrderTracking({ orders }) {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-surface rounded-3xl overflow-hidden shadow-sm border border-surface-variant transition-all hover:shadow-md"
        >
          {/* Header */}
          <div
            className="px-6 py-5 flex justify-between items-center"
            style={{ backgroundColor: STATUS_COLORS[order.status] + '18' }}
          >
            <div>
              <p className="text-xs font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">
                {formatTime(order.created_at)}
              </p>
              <p className="font-noto-serif font-bold text-on-surface text-lg">
                {order.items?.reduce((s, i) => s + i.quantity, 0)} item{order.items?.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress steps */}
          <div className="px-6 py-5 border-b border-surface-variant">
            <div className="flex items-center gap-0">
              {STEPS.map((step, i) => {
                const stepIndex = STEPS.indexOf(order.status);
                const isCompleted = i < stepIndex;
                const isActive = i === stepIndex;
                const isFuture = i > stepIndex;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[16px] transition-all duration-300 ${
                          isActive ? 'scale-110 shadow-lg' : ''
                        }`}
                        style={{
                          backgroundColor: isCompleted
                            ? '#c8853a'
                            : isActive
                            ? STATUS_COLORS[order.status]
                            : 'transparent',
                          color: isCompleted || isActive ? 'white' : '#9ca3af',
                          border: isCompleted || isActive ? 'none' : '1px dashed #e5e7eb',
                          boxShadow: isActive
                            ? `0 0 0 4px ${STATUS_COLORS[order.status]}33`
                            : 'none',
                        }}
                      >
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">{STEP_ICONS[step]}</span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-label-sm uppercase tracking-wider mt-2 text-center"
                        style={{
                          color: isActive
                            ? STATUS_COLORS[order.status]
                            : isFuture
                            ? '#d1d5db'
                            : '#6b7280',
                          fontWeight: isActive ? '700' : '500',
                        }}
                      >
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="h-[2px] flex-1 mb-6 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor:
                            i < stepIndex ? '#c8853a' : '#f3f4f6',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items summary */}
          <div className="px-6 py-5">
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm font-body-md text-on-surface">
                  <span>
                    <span className="font-bold text-primary mr-1">{item.quantity}×</span> {item.name}
                    {item.notes && (
                      <span className="text-on-surface-variant/70 italic text-xs ml-1 block mt-0.5">↳ {item.notes}</span>
                    )}
                  </span>
                  <span className="font-bold">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {order.status === 'ready' && (
              <div className="mt-5 bg-secondary-container/50 border border-secondary/20 text-on-secondary-container text-sm font-body-md px-4 py-3 rounded-2xl flex items-start gap-3 animate-pulse-soft">
                <span className="material-symbols-outlined text-secondary mt-0.5 text-[20px]">notifications_active</span>
                <span className="leading-snug">Your order is ready! A server will bring it to your table shortly.</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className="text-xs font-label-sm uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm border"
      style={{
        backgroundColor: STATUS_COLORS[status] + '15',
        color: STATUS_COLORS[status],
        borderColor: STATUS_COLORS[status] + '30',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const STEP_ICONS = {
  received: 'receipt_long',
  preparing: 'skillet',
  ready: 'task_alt',
  delivered: 'room_service',
};

const STEP_LABELS = {
  received: 'Received',
  preparing: 'Cooking',
  ready: 'Ready',
  delivered: 'Served',
};
