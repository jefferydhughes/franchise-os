'use client';

import { UserCheck } from 'lucide-react';

export default function FranchiseesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Franchisees</h1>
        <p className="mt-1 text-slate-400">
          Manage and monitor your active franchise owners and their performance
        </p>
      </div>

      {/* Empty State Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <UserCheck className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Franchisee management coming soon</p>
          <p className="text-xs text-slate-600 mt-1">
            Full franchisee profiles, performance tracking, and communication tools are on the way
          </p>
        </div>
      </div>
    </div>
  );
}
