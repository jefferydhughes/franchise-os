'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Clock, Bot, Inbox } from 'lucide-react';

interface AgentEvent {
  id: string;
  agent_name: string;
  tier?: string;
  event_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  summary?: string;
}

interface SwarmActivityFeedProps {
  brandId: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  processing: { bg: 'bg-blue-500/10',  text: 'text-blue-400',  dot: 'bg-blue-400' },
  completed:  { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  failed:     { bg: 'bg-red-500/10',   text: 'text-red-400',   dot: 'bg-red-400' },
};

const TIER_COLORS: Record<string, string> = {
  king:     'bg-amber-400',
  queen:    'bg-purple-400',
  bishop:   'bg-blue-400',
  knight:   'bg-green-400',
  rook:     'bg-red-400',
  pawn:     'bg-slate-400',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function SwarmActivityFeed({ brandId }: SwarmActivityFeedProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents?brandId=${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.events ?? []);
    } catch {
      // Silently handle — keep existing events
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Swarm Activity</h3>
        </div>
        <button
          onClick={fetchEvents}
          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[400px] scrollbar-thin scrollbar-thumb-slate-700">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Loading activity...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Inbox className="w-8 h-8 mb-2 text-slate-600" />
            <p className="text-sm">No swarm activity yet</p>
            <p className="text-xs text-slate-600 mt-1">Events will appear here as agents work</p>
          </div>
        ) : (
          events.map((event) => {
            const status = STATUS_STYLES[event.status] ?? STATUS_STYLES.pending;
            const tierColor = TIER_COLORS[event.tier ?? ''] ?? 'bg-slate-400';

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-700/50 transition-colors group"
              >
                {/* Agent indicator */}
                <div className="relative mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${tierColor} ring-2 ring-slate-800`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {event.agent_name}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {event.event_type.replace(/_/g, ' ').replace(/\./g, ' > ')}
                  </p>
                  {event.summary && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{event.summary}</p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {relativeTime(event.created_at)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
