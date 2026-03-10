'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, Loader2, Clock } from 'lucide-react';

interface MemoryEntry {
  id: string;
  layer: string;
  content: string;
  created_at: string;
}

const LAYER_STYLES: Record<string, { bg: string; text: string }> = {
  episodic:       { bg: 'bg-blue-500/15',    text: 'text-blue-400' },
  semantic:       { bg: 'bg-purple-500/15',   text: 'text-purple-400' },
  strategic:      { bg: 'bg-red-500/15',      text: 'text-red-400' },
  brand:          { bg: 'bg-amber-500/15',    text: 'text-amber-400' },
  market:         { bg: 'bg-green-500/15',    text: 'text-green-400' },
  campaign:       { bg: 'bg-pink-500/15',     text: 'text-pink-400' },
  franchisee:     { bg: 'bg-cyan-500/15',     text: 'text-cyan-400' },
  territory:      { bg: 'bg-emerald-500/15',  text: 'text-emerald-400' },
  'decision-log': { bg: 'bg-orange-500/15',   text: 'text-orange-400' },
};

const ALL_LAYERS = Object.keys(LAYER_STYLES);

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

export default function MemoryWidget() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/memory');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : data.entries ?? []);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const availableLayers = ALL_LAYERS.filter((layer) =>
    entries.some((e) => e.layer === layer)
  );

  const filtered = activeLayer
    ? entries.filter((e) => e.layer === activeLayer)
    : entries;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Memory Intelligence</h3>
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Layer Filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => setActiveLayer(null)}
          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
            activeLayer === null
              ? 'bg-slate-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        {availableLayers.map((layer) => {
          const style = LAYER_STYLES[layer] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400' };
          const isActive = activeLayer === layer;
          return (
            <button
              key={layer}
              onClick={() => setActiveLayer(isActive ? null : layer)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                isActive
                  ? `${style.bg} ${style.text} ring-1 ring-current`
                  : `bg-slate-700/50 text-slate-400 hover:${style.text}`
              }`}
            >
              {layer}
            </button>
          );
        })}
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[350px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading memory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Brain className="w-8 h-8 mb-2 text-slate-600" />
            <p className="text-sm">No memory entries</p>
            <p className="text-xs text-slate-600 mt-1">
              {activeLayer ? `No ${activeLayer} entries found` : 'Memory will accumulate as agents work'}
            </p>
          </div>
        ) : (
          filtered.map((entry) => {
            const style = LAYER_STYLES[entry.layer] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400' };

            return (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                    {entry.layer}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                    <Clock className="w-3 h-3" />
                    {relativeTime(entry.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {entry.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
