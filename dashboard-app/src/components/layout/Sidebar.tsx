'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hexagon,
  Swords,
  MapPin,
  Users,
  UserCheck,
  Megaphone,
  Rocket,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',            label: 'War Room',    icon: Swords },
  { href: '/territory',   label: 'Territories', icon: MapPin },
  { href: '/leads',       label: 'Leads',       icon: Users },
  { href: '/franchisees', label: 'Franchisees', icon: UserCheck },
  { href: '/campaigns',   label: 'Campaigns',   icon: Megaphone },
  { href: '/initiatives', label: 'Initiatives', icon: Rocket },
  { href: '/memory',      label: 'Memory',      icon: Brain },
  { href: '/settings',    label: 'Settings',    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Hexagon className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-white tracking-tight">
            FranchiseOS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600/15 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle (desktop only) */}
      <div className="hidden lg:block border-t border-slate-700 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-700 transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        {navContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-slate-900 border-r border-slate-700 transition-all ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
