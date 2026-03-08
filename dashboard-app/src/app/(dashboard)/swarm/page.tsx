'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bot, Activity, Filter, ChevronDown, ChevronUp,
  Clock, Zap, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';

// ── Agent registry ──────────────────────────────────────────────────────────
type Tier = 'executive' | 'department' | 'memory' | 'worker';

const AGENTS = [
  { name: 'CEO', key: 'CEO_AGENT', tier: 'executive' as const },
  { name: 'CRO', key: 'CRO_AGENT', tier: 'executive' as const },
  { name: 'COO', key: 'COO_AGENT', tier: 'executive' as const },
  { name: 'CMO', key: 'CMO_AGENT', tier: 'executive' as const },
  { name: 'Market Opportunity', key: 'MARKET_OPPORTUNITY_AGENT', tier: 'department' as const },
  { name: 'Territory Intelligence', key: 'TERRITORY_INTELLIGENCE_AGENT', tier: 'department' as const },
  { name: 'Lead Intelligence', key: 'LEAD_INTELLIGENCE_AGENT', tier: 'department' as const },
  { name: 'Sales Pipeline', key: 'SALES_PIPELINE_AGENT', tier: 'department' as const },
  { name: 'Campaign', key: 'CAMPAIGN_AGENT', tier: 'department' as const },
  { name: 'Content Strategy', key: 'CONTENT_STRATEGY_AGENT', tier: 'department' as const },
  { name: 'Onboarding', key: 'ONBOARDING_AGENT', tier: 'department' as const },
  { name: 'Coaching', key: 'COACHING_AGENT', tier: 'department' as const },
  { name: 'Memory Curator', key: 'MEMORY_CURATOR_AGENT', tier: 'memory' as const },
  { name: 'Pattern Detection', key: 'PATTERN_DETECTION_AGENT', tier: 'memory' as const },
  { name: 'Learning', key: 'LEARNING_AGENT', tier: 'memory' as const },
  { name: 'Landing Page', key: 'LANDING_PAGE_AGENT', tier: 'worker' as const },
  { name: 'Email', key: 'EMAIL_AGENT', tier: 'worker' as const },
  { name: 'Social Content', key: 'SOCIAL_CONTENT_AGENT', tier: 'worker' as const },
  { name: 'Report', key: 'REPORT_AGENT', tier: 'worker' as const },
  { name: 'Initiative', key: 'INITIATIVE_AGENT', tier: 'worker' as const },
];

// ── Style maps ──────────────────────────────────────────────────────────────
const TIER_BADGE: Record<Tier, { bg: string; text: string }> = {
  executive:  { bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  department: { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  memory:     { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  worker:     { bg: 'bg-slate-500/15',  text: 'text-slate-400' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  completed:  { bg: 'bg-green-500/10',  text: 'text-green-400',  icon: CheckCircle2 },
  processing: { bg: 'bg-blue-500/10',   text: 'text-blue-400',   icon: Loader2 },
  pending:    { bg: 'bg-amber-500/10',  text: 'text-amber-400',  icon: Clock },
  failed:     { bg: 'bg-red-500/10',    text: 'text-red-400',    icon: AlertCircle },
};

const FILTER_OPTIONS: Array<{ label: string; value: Tier | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Executive', value: 'executive' },
  { label: 'Department', value: 'department' },
  { label: 'Memory', value: 'memory' },
  { label: 'Worker', value: 'worker' },
];

// ── Types ───────────────────────────────────────────────────────────────────
interface AgentEvent {
  id: string;
  agent_name: string;
  event_type: string;
  status: string;
  payload?: Record<string, unknown>;
  created_at: string;
  summary?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function deriveStatus(events: AgentEvent[]): 'running' | 'error' | 'idle' {
  if (!events.length) return 'idle';
  const latest = events[0];
  if (latest.status === 'failed') return 'error';
  if (latest.status === 'processing') return 'running';
  return 'idle';
}

// ── Component ───────────────────────────────────────────────────────────────
export default function SwarmMonitorPage() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Tier | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?limit=200');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.events ?? []);
    } catch {
      /* keep stale data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 5_000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  // Group events by agent key
  const grouped: Record<string, AgentEvent[]> = {};
  for (const e of events) {
    (grouped[e.agent_name] ??= []).push(e);
  }

  const filtered = filter === 'all' ? AGENTS : AGENTS.filter((a) => a.tier === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Swarm Monitor</h1>
          <p className="mt-1 text-slate-400">Real-time status of all 20 agents</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && events.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-slate-800 border border-slate-700 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Bot className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm">No agents match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((agent) => {
            const agentEvents = grouped[agent.key] ?? [];
            const status = deriveStatus(agentEvents);
            const latest = agentEvents[0];
            const isOpen = expanded === agent.key;
            const tier = TIER_BADGE[agent.tier];

            return (
              <div key={agent.key} className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : agent.key)}
                  className="w-full p-4 text-left hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Bot className="w-5 h-5 text-slate-300" />
                        <span
                          className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-800 ${
                            status === 'running'
                              ? 'bg-green-400 animate-pulse'
                              : status === 'error'
                              ? 'bg-red-400'
                              : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">{agent.name}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  {/* Tier badge + event count */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${tier.bg} ${tier.text}`}>
                      {agent.tier}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Zap className="w-3 h-3" />
                      {agentEvents.length} events
                    </span>
                  </div>

                  {/* Last action + timestamp */}
                  {latest ? (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-slate-400 truncate">
                        {latest.event_type.replace(/_/g, ' ').replace(/\./g, ' > ')}
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {relativeTime(latest.created_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-600 italic">No activity yet</p>
                  )}
                </button>

                {/* Expandable detail panel — last 5 events */}
                {isOpen && (
                  <div className="border-t border-slate-700 bg-slate-850 px-4 py-3 space-y-2">
                    {agentEvents.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-2">No events recorded</p>
                    ) : (
                      agentEvents.slice(0, 5).map((ev) => {
                        const sb = STATUS_BADGE[ev.status] ?? STATUS_BADGE.pending;
                        const Icon = sb.icon;
                        return (
                          <div key={ev.id} className="flex items-start gap-2 text-xs">
                            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${sb.text}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300 truncate">
                                  {ev.event_type.replace(/_/g, ' ')}
                                </span>
                                <span className={`px-1.5 py-px rounded text-[9px] font-medium ${sb.bg} ${sb.text}`}>
                                  {ev.status}
                                </span>
                              </div>
                              {ev.payload && (
                                <p className="text-slate-600 truncate mt-0.5">
                                  {JSON.stringify(ev.payload).slice(0, 80)}
                                </p>
                              )}
                              <p className="text-slate-600 mt-0.5">{relativeTime(ev.created_at)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
