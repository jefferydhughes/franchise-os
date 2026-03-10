'use client';

import { Megaphone } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-slate-400">
          Create and manage marketing campaigns across all franchise territories
        </p>
      </div>

      {/* Empty State Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Megaphone className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Campaign tools coming soon</p>
          <p className="text-xs text-slate-600 mt-1">
            Multi-channel campaign management, targeting, and analytics are on the way
          </p>
        </div>
      </div>
    </div>
  );
}
