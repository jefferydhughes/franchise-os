'use client';

import { useState, useEffect, useCallback } from 'react';
import { Kanban, Loader2, Bot, ChevronRight } from 'lucide-react';

interface Initiative {
  id: string;
  title: string;
  type: string;
  status: string;
  agent_assigned: string;
  outcome?: string;
  created_at: string;
}

interface InitiativeBoardProps {
  brandId: string;
}

const COLUMNS = [
  { key: 'detected',        label: 'Detected',        dot: 'bg-slate-400' },
  { key: 'recommended',     label: 'Recommended',     dot: 'bg-amber-400' },
  { key: 'approved',        label: 'Approved',         dot: 'bg-blue-400' },
  { key: 'in_progress',     label: 'In Progress',      dot: 'bg-purple-400' },
  { key: 'learning_review', label: 'Learning Review',  dot: 'bg-green-400' },
];

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  market_expansion:       { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  unit_recovery:          { bg: 'bg-red-500/15',    text: 'text-red-400' },
  campaign_optimization:  { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  territory_outreach:     { bg: 'bg-green-500/15',  text: 'text-green-400' },
  onboarding_support:     { bg: 'bg-amber-500/15',  text: 'text-amber-400' },
};

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InitiativeBoard({ brandId }: InitiativeBoardProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitiatives = useCallback(async () => {
    try {
      const res = await fetch(`/api/initiatives?brandId=${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInitiatives(Array.isArray(data) ? data : data.initiatives ?? []);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: initiatives.filter((i) => i.status === col.key),
  }));

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Kanban className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Initiative Board</h3>
        <span className="ml-auto text-xs text-slate-500">
          {initiatives.length} initiative{initiatives.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading initiatives...
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {grouped.map((column) => (
            <div key={column.key} className="flex-shrink-0 w-56">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`w-2 h-2 rounded-full ${column.dot}`} />
                <span className="text-xs font-medium text-slate-300">{column.label}</span>
                <span className="text-[10px] text-slate-500 ml-auto">
                  {column.items.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="space-y-2 min-h-[120px]">
                {column.items.length === 0 ? (
                  <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-slate-700 text-slate-600 text-[10px]">
                    No items
                  </div>
                ) : (
                  column.items.map((initiative) => {
                    const typeStyle = TYPE_STYLES[initiative.type] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400' };

                    return (
                      <div
                        key={initiative.id}
                        className="p-2.5 rounded-lg border border-slate-700/50 bg-slate-900/50 hover:border-slate-600 transition-colors cursor-pointer group"
                      >
                        {/* Type Badge */}
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text} mb-1.5`}>
                          {formatType(initiative.type)}
                        </span>

                        {/* Title */}
                        <h4 className="text-xs font-medium text-white line-clamp-2 mb-1.5">
                          {initiative.title}
                        </h4>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Bot className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{initiative.agent_assigned}</span>
                          </div>
                          {initiative.outcome && (
                            <span className="text-[10px] text-green-400 font-medium">
                              {initiative.outcome}
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
