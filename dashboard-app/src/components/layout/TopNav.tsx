'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Building2,
  User,
  Command,
} from 'lucide-react';

export default function TopNav() {
  const [brandOpen, setBrandOpen] = useState(false);
  const [notificationCount] = useState(3);

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left: Brand Selector */}
      <div className="relative">
        <button
          onClick={() => setBrandOpen(!brandOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-sm text-white transition-colors"
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline font-medium">Select Brand</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
        </button>

        {brandOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setBrandOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Brands
              </div>
              {['All Brands', 'Brand Alpha', 'Brand Beta', 'Brand Gamma'].map((brand) => (
                <button
                  key={brand}
                  onClick={() => setBrandOpen(false)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                  {brand}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Center: Command Trigger */}
      <button className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 text-sm text-slate-400 hover:text-slate-300 transition-colors max-w-md w-full mx-4">
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search or command...</span>
        <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <button className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Bell className="w-4.5 h-4.5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User Avatar (placeholder for Clerk UserButton) */}
        <button className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
