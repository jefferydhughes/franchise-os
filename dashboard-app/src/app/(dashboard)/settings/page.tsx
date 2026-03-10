'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-slate-400">
          Configure your brand, integrations, agent behavior, and account preferences
        </p>
      </div>

      {/* Empty State Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Settings className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Settings panel coming soon</p>
          <p className="text-xs text-slate-600 mt-1">
            Brand configuration, API keys, notification preferences, and more are on the way
          </p>
        </div>
      </div>
    </div>
  );
}
