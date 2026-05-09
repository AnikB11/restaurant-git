// components/LoginForm.jsx
import { useState } from 'react';

export default function LoginForm({ onLogin, loading, error, role = 'Kitchen' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const isDark = role === 'Kitchen';

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-charcoal-900 text-surface' : 'bg-surface text-on-surface'}`}>
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 text-[40px] shadow-sm ${
              isDark ? 'bg-charcoal-800 text-primary border border-charcoal-700/50' : 'bg-surface-variant/50 text-primary border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[40px]">{role === 'Kitchen' ? 'skillet' : 'storefront'}</span>
          </div>
          <h1 className="font-noto-serif text-4xl font-bold mb-2 tracking-tight">
            {role} Portal
          </h1>
          <p className={`font-body-md text-sm uppercase tracking-widest ${isDark ? 'text-surface-variant/50' : 'text-on-surface-variant'}`}>
            Restaurant Operating System
          </p>
        </div>

        {/* Card */}
        <div
          className={`rounded-[32px] p-8 shadow-2xl ${
            isDark 
              ? 'bg-charcoal-800 border border-charcoal-700/50 shadow-black/50' 
              : 'bg-surface border border-outline-variant/30 shadow-primary/5'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className={`block text-sm font-label-sm uppercase tracking-wider mb-2 pl-1 ${
                  isDark ? 'text-surface-variant/70' : 'text-on-surface-variant/70'
                }`}
              >
                Email
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] ${
                  isDark ? 'text-surface-variant/50' : 'text-on-surface-variant/50'
                }`}>mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="staff@restaurant.com"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl font-body-md text-sm outline-none transition-all ${
                    isDark 
                      ? 'bg-charcoal-900/50 border border-charcoal-700 focus:border-primary focus:bg-charcoal-900 text-surface placeholder:text-surface-variant/30' 
                      : 'bg-surface-variant/30 border border-outline-variant/30 focus:border-primary focus:bg-surface text-on-surface placeholder:text-on-surface-variant/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-label-sm uppercase tracking-wider mb-2 pl-1 ${
                  isDark ? 'text-surface-variant/70' : 'text-on-surface-variant/70'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] ${
                  isDark ? 'text-surface-variant/50' : 'text-on-surface-variant/50'
                }`}>lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl font-body-md text-sm outline-none transition-all ${
                    isDark 
                      ? 'bg-charcoal-900/50 border border-charcoal-700 focus:border-primary focus:bg-charcoal-900 text-surface placeholder:text-surface-variant/30' 
                      : 'bg-surface-variant/30 border border-outline-variant/30 focus:border-primary focus:bg-surface text-on-surface placeholder:text-on-surface-variant/50'
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm font-body-md px-4 py-3 rounded-2xl flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-label-sm text-base transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2 mt-2 ${
                isDark 
                  ? 'bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20' 
                  : 'bg-secondary text-on-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20'
              }`}
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> Signing in...</>
              ) : (
                <><span className="material-symbols-outlined">login</span> Sign In</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
