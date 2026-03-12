'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Radar,
  MapPin,
  TrendingUp,
  Users,
  Store,
  Search,
  Loader2,
  Zap,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Opportunity {
  id: string;
  signal_type: 'lead_cluster' | 'territory_threshold' | 'competitor_closed' | 'search_volume_spike';
  location_label: string;
  score: number;
  summary: string;
  recommended_action: string;
  created_at: string;
  // raw payload fields for the chain
  lat?: number;
  lng?: number;
}

interface OpportunityRadarProps {
  brandId?: string;
}

const SIGNAL_CONFIG: Record<string, { icon: typeof MapPin; color: string; bg: string; label: string }> = {
  lead_cluster:         { icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/15',   label: 'Lead Cluster' },
  territory_threshold:  { icon: MapPin,     color: 'text-green-400',  bg: 'bg-green-500/15',  label: 'Territory Threshold' },
  competitor_closed:    { icon: Store,      color: 'text-amber-400',  bg: 'bg-amber-500/15',  label: 'Competitor Closed' },
  search_volume_spike:  { icon: Search,     color: 'text-purple-400', bg: 'bg-purple-500/15', label: 'Search Spike' },
};

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'High confidence';
  if (score >= 60) return 'Moderate confidence';
  return 'Early signal';
}

// ── Confirmation Modal ────────────────────────────────────────────────────────

interface ModalProps {
  opportunity: Opportunity;
  onConfirm: () => void;
  onCancel: () => void;
  launching: boolean;
}

function ConfirmModal({ opportunity, onConfirm, onCancel, launching }: ModalProps) {
  const config = SIGNAL_CONFIG[opportunity.signal_type] ?? SIGNAL_CONFIG.lead_cluster;

  const CHAIN_STEPS = [
    { agent: 'CEO_AGENT',                     action: 'Evaluate opportunity & approve expansion' },
    { agent: 'TERRITORY_INTELLIGENCE_AGENT',  action: 'Score territory & confirm availability' },
    { agent: 'LANDING_PAGE_AGENT',            action: 'Generate localized recruitment page' },
    { agent: 'EMAIL_AGENT',                   action: 'Create 5-email 14-day outreach sequence' },
    { agent: 'SOCIAL_CONTENT_AGENT',          action: 'Produce 14-post social campaign' },
    { agent: 'CEO_AGENT',                     action: 'Create initiative record & schedule 14-day review' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!launching ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Launch Initiative
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {opportunity.location_label}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-xs text-slate-400">Score: {opportunity.score}</span>
            </div>
          </div>
          {!launching && (
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Signal summary */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-sm text-slate-300 mb-4">{opportunity.summary}</p>

          {/* Agent chain preview */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            6-Agent Chain Will Execute
          </p>
          <div className="space-y-2">
            {CHAIN_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold">{i + 1}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-300">{step.agent}</span>
                  <p className="text-[11px] text-slate-500">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-700">
          <button
            onClick={onCancel}
            disabled={launching}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={launching}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
          >
            {launching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                GO — Launch Swarm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

function Toast({ type, message, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm rounded-xl border border-slate-600 bg-slate-900 p-4 shadow-2xl">
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {type === 'success' ? 'Initiative Launched' : 'Launch Failed'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OpportunityRadar({ brandId }: OpportunityRadarProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [pendingOpp, setPendingOpp] = useState<Opportunity | null>(null);
  const [launching, setLaunching] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Launched set — hides GO button after a successful launch for that signal
  const [launched, setLaunched] = useState<Set<string>>(new Set());

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/agent-events?brandId=${brandId}&event_type=opportunity.detected`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const items: Opportunity[] = (Array.isArray(data) ? data : data.events ?? [])
        .map((e: Record<string, unknown>) => {
          const payload = (e.payload as Record<string, unknown>) ?? {};
          const location = (payload.location as Record<string, unknown>) ?? {};
          return {
            id: e.id as string,
            signal_type: (payload.signal_type ?? payload.type ?? e.signal_type ?? 'lead_cluster') as Opportunity['signal_type'],
            location_label: String(payload.location_label ?? location.label ?? e.location_label ?? 'Unknown'),
            score: Number(payload.score ?? e.score ?? 0),
            summary: String(payload.summary ?? e.summary ?? ''),
            recommended_action: String(payload.recommended_action ?? e.recommended_action ?? ''),
            created_at: String(e.created_at),
            lat: Number(location.lat ?? payload.lat ?? 0),
            lng: Number(location.lng ?? payload.lng ?? 0),
          };
        })
        .sort((a: Opportunity, b: Opportunity) => b.score - a.score);
      setOpportunities(items);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleLaunch = async () => {
    if (!pendingOpp) return;
    setLaunching(true);

    try {
      const signal = {
        id: pendingOpp.id,
        type: pendingOpp.signal_type,
        location: {
          lat: pendingOpp.lat ?? 32.7767,
          lng: pendingOpp.lng ?? -96.797,
          label: pendingOpp.location_label,
        },
        score: pendingOpp.score,
        summary: pendingOpp.summary,
        recommended_action: pendingOpp.recommended_action,
      };

      const res = await fetch('/api/opportunity-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal, brandId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Unknown error');

      setLaunched((prev) => new Set(prev).add(pendingOpp.id));
      setToast({
        type: 'success',
        message: `${pendingOpp.location_label} — 6-agent chain complete. Initiative is live.`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Chain execution failed.',
      });
    } finally {
      setLaunching(false);
      setPendingOpp(null);
    }
  };

  return (
    <>
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
              Scanning for opportunities…
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
              const isLaunched = launched.has(opp.id);

              return (
                <div
                  key={opp.id}
                  className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/50 hover:border-slate-600 transition-colors"
                >
                  {/* Top row: icon + type badge + location + score */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-sm font-semibold text-white flex-1 truncate">
                      {opp.location_label}
                    </span>
                    <span className="text-lg font-bold text-white flex-shrink-0">{opp.score}</span>
                  </div>

                  {/* Score bar */}
                  <div className="h-1 rounded-full bg-slate-700 mb-2">
                    <div
                      className={`h-1 rounded-full transition-all ${scoreColor(opp.score)}`}
                      style={{ width: `${opp.score}%` }}
                    />
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">{opp.summary}</p>

                  {/* Recommended action + GO button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <TrendingUp className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      <span className="text-[11px] text-blue-400 truncate">{opp.recommended_action}</span>
                    </div>

                    {isLaunched ? (
                      <div className="flex items-center gap-1 flex-shrink-0 text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">Launched</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPendingOpp(opp)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        GO
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingOpp && (
        <ConfirmModal
          opportunity={pendingOpp}
          onConfirm={handleLaunch}
          onCancel={() => setPendingOpp(null)}
          launching={launching}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}