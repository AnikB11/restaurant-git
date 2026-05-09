// components/MenuCard.jsx
import { useState, useEffect } from 'react';

export default function MenuCard({ item, onAdd, cartQuantity = 0 }) {
  const [adding, setAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Prevent background scrolling when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isExpanded]);

  const handleAdd = async (e) => {
    e.stopPropagation();
    setAdding(true);
    onAdd(item);
    setTimeout(() => setAdding(false), 500);
  };

  return (
    <>
      {/* ── STANDARD CARD ── */}
      <div
        onClick={() => item.available && setIsExpanded(true)}
        className={`bg-surface rounded-3xl overflow-hidden transition-all duration-300 border border-surface-variant cursor-pointer ${
          item.available ? 'hover:shadow-lg hover:border-amber-500/50 hover:-translate-y-1' : 'opacity-60 grayscale-[0.5]'
        }`}
      >
        {/* Image */}
        <div className="relative h-40 bg-surface-variant overflow-hidden group">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-surface-container-low text-primary/20">
              {categoryEmoji(item.category)}
            </div>
          )}

          {/* Out of stock overlay */}
          {!item.available && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-error text-on-error text-xs font-label-sm px-4 py-1.5 rounded-full shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Cart badge */}
          {cartQuantity > 0 && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-on-primary text-xs font-label-sm shadow-md animate-bounce-in">
              {cartQuantity}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col h-[calc(100%-10rem)] justify-between">
          <div>
            <h3 className="font-noto-serif font-bold text-on-surface text-lg leading-tight mb-2 line-clamp-2">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-on-surface-variant text-xs font-body-md leading-relaxed mb-4 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-variant/50">
            <span className="font-noto-serif font-bold text-primary text-xl">
              ₹{item.price.toLocaleString('en-IN')}
            </span>

            {item.available ? (
              <button
                onClick={handleAdd}
                disabled={adding}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-label-sm transition-all active:scale-[0.95] ${
                  adding 
                    ? 'bg-secondary text-on-secondary shadow-md' 
                    : cartQuantity > 0 
                      ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/80' 
                      : 'bg-primary text-on-primary hover:opacity-90 shadow-sm hover:shadow-md'
                }`}
              >
                {adding ? (
                  <><span className="material-symbols-outlined text-[16px]">check</span> Added</>
                ) : cartQuantity > 0 ? (
                  <><span className="material-symbols-outlined text-[16px]">add</span> More</>
                ) : (
                  <><span className="material-symbols-outlined text-[16px]">add_shopping_cart</span> Add</>
                )}
              </button>
            ) : (
              <span className="text-on-surface-variant/50 text-xs font-label-sm uppercase tracking-wider">Unavailable</span>
            )}
          </div>
        </div>
      </div>

      {/* ── FULL SCREEN PREMIUM OVERLAY ── */}
      {isExpanded && item.available && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:p-6">
          <div 
            className="w-full sm:max-w-xl bg-surface sm:rounded-[32px] rounded-t-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Image & Close */}
            <div className="relative h-64 sm:h-80 shrink-0 bg-surface-variant">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-primary/20">
                  {categoryEmoji(item.category)}
                </div>
              )}
              
              {/* Gradient Overlay for Text Visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors border border-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <span className="bg-amber-500/90 backdrop-blur text-[#2d1a0e] text-xs font-label-sm px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                  {item.category}
                </span>
                <h2 className="font-noto-serif text-3xl sm:text-4xl font-bold leading-tight drop-shadow-md">
                  {item.name}
                </h2>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              {/* Description */}
              <p className="text-on-surface-variant font-body-md text-base sm:text-lg leading-relaxed">
                {item.description || 'A delicious offering from our kitchen.'}
              </p>

              {/* Macros / Nutrition */}
              {item.macros && (
                <div className="space-y-3">
                  <h4 className="font-label-sm uppercase tracking-widest text-xs text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">monitor_weight</span> Nutrition Facts
                  </h4>
                  <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    {Object.entries(item.macros).map(([key, val]) => (
                      <div key={key} className="bg-surface-variant/40 border border-outline-variant/30 rounded-2xl p-3 text-center">
                        <div className="text-on-surface font-bold font-noto-serif text-lg">{val}</div>
                        <div className="text-on-surface-variant text-[10px] sm:text-xs font-label-sm uppercase tracking-wider">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {item.ingredients && item.ingredients.length > 0 && (
                <div className="space-y-3 pb-8">
                  <h4 className="font-label-sm uppercase tracking-widest text-xs text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">restaurant_menu</span> Premium Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {item.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-primary/5 text-primary border border-primary/20 text-sm font-body-md">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Add to Cart Bar */}
            <div className="shrink-0 p-5 sm:p-6 bg-surface border-t border-surface-variant flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-on-surface-variant font-label-sm uppercase tracking-widest mb-1">Total Price</div>
                <div className="font-noto-serif text-3xl font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</div>
              </div>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 max-w-xs py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-label-sm text-lg shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {adding ? (
                  <><span className="material-symbols-outlined text-[20px]">check</span> Added to Cart</>
                ) : (
                  <><span className="material-symbols-outlined text-[20px]">add_shopping_cart</span> Add to Order {cartQuantity > 0 && `(${cartQuantity})`}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function categoryEmoji(category) {
  const map = {
    Drinks: 'local_bar',
    Starters: 'tapas',
    Mains: 'restaurant',
    Desserts: 'cake',
  };
  return <span className="material-symbols-outlined text-inherit text-[2em]">{map[category] || 'restaurant'}</span>;
}

