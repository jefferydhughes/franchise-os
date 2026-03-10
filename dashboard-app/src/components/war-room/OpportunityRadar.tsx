'use client';

import { useState, useEffect, useCallback } from 'react';
import { Radar, MapPin, TrendingUp, Users, Store, Search, Loader2 } from 'lucide-react';

interface Opportunity {
  id: string;
  signal_type: 'lead_cluster' | 'territory_threshold' | 'competitor_closed' | 'search_volume_spike';
  location_label: string;
  score: number;
  summary: string;
  recommended_action: string;
  created_at: string;
}

const SIGNAL_CONFIG: Record<string, { icon: typeof MapPin; color: string; bg: string; label: string }> = {
  lead_cluster:        { icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/15',   label: 'Lead Cluster' },
  territory_threshold: { icon: MapPin,     color: 'text-green-400',  bg: 'bg-green-500/15',  label: 'Territory Threshold' },
  competitor_closed:   { icon: Store,      color: 'text-amber-400',  bg: 'bg-amber-500/15',  label: 'Competitor Closed' },
  search_volume_spike: { icon: Search,     color: 'text-purple-400', bg: 'bg-purple-500/15', label: 'Search Spike' },
};

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function OpportunityRadar() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-events');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const items: Opportunity[] = (Array.isArray(data) ? data : data.events ?? [])
        .filter((e: Record<string, unknown>) => e.event_type === 'opportunity.detected')
        .map((e: Record<string, unknown>) => ({
          id: e.id,
          signal_type: (e.payload as Record<string, unknown>)?.signal_type ?? (e as Record<string, unknown>).signal_type ?? 'lead_cluster',
          location_label: (e.payload as Record<string, unknown>)?.location_label ?? (e as Record<string, unknown>).location_label ?? 'Unknown',
          score: Number((e.payload as Record<string, unknown>)?.score ?? (e as Record<string, unknown>).score ?? 0),
          summary: String((e.payload as Record<string, unknown>)?.summary ?? (e as Record<string, unknown>).summary ?? ''),
          recommended_action: String((e.payload as Record<string, unknown>)?.recommended_action ?? (e as Record<string, unknown>).recommended_action ?? ''),
          created_at: String(e.created_at),
        }))
        .sort((a: Opportunity, b: Opportunity) => b.score - a.score);
      setOpportunities(items);
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Radar className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Opportunity Radar</h3>
        <span className="ml-auto text-xs text-slate-500">
          {opportunities.length} signal{opportunities.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Signal List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[420px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Scanning for opportunities...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Radar className="w-8 h-8 mb-2 text-slate-600" />
            <p className="text-sm">No opportunities detected</p>
            <p className="text-xs text-slate-600 mt-1">The swarm is scanning for expansion signals</p>
          </div>
        ) : (
          opportunities.map((opp) => {
            const config = SIGNAL_CONFIG[opp.signal_type] ?? SIGNAL_CONFIG.lead_cluster;
            const Icon = config.icon;

            return (
              <div
                key={opp.id}
                className="p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 bg-slate-900/40 transition-colors"
              >
                {/* Signal Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{opp.location_label}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">{opp.score}</span>
                </div>

                {/* Score Bar */}
                <div className="w-full h-1.5 bg-slate-700 rounded-full mb-2">
                  <div
                    className={`h-full rounded-full ${scoreColor(opp.score)} transition-all`}
                    style={{ width: `${Math.min(opp.score, 100)}%` }}
                  />
                </div>

                {/* Summary */}
                {opp.summary && (
                  <p className="text-xs text-slate-400 mb-1.5 line-clamp-2">{opp.summary}</p>
                )}

                {/* Action */}
                {opp.recommended_action && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="truncate">{opp.recommended_action}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
