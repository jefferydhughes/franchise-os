'use client';

import { Brain } from 'lucide-react';

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Memory</h1>
        <p className="mt-1 text-slate-400">
          Explore the AI swarm&apos;s stored knowledge, decisions, and learned context
        </p>
      </div>

      {/* Empty State Card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Brain className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Memory explorer coming soon</p>
          <p className="text-xs text-slate-600 mt-1">
            Browse brand memory, decision logs, and platform intelligence surfaced by your agents
          </p>
        </div>
      </div>
    </div>
  );
}
