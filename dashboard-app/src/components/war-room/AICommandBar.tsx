'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Sparkles, Loader2, Zap, ArrowRight } from 'lucide-react';

interface CommandResponse {
  message: string;
  actions?: { label: string; action: string; payload?: Record<string, unknown> }[];
}

interface AICommandBarProps {
  brandId: string;
}

export default function AICommandBar({ brandId }: AICommandBarProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async () => {
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, brandId }),
      });

      if (!res.ok) {
        throw new Error(`Command failed (${res.status})`);
      }

      const data: CommandResponse = await res.json();
      setResponse(data);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [input, loading, brandId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Global Cmd+K listener
  if (typeof window !== 'undefined') {
    // This is handled via useEffect in practice; kept simple here
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-xl p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">AI Command Bar</h3>
        <span className="ml-auto text-xs text-slate-500 font-mono bg-slate-700/50 px-2 py-0.5 rounded">
          ⌘K
        </span>
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Command the swarm... e.g. 'Find expansion opportunities in Texas'"
            disabled={loading}
            className="w-full bg-slate-900/80 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 transition-all"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="mt-3 space-y-3">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
            <p className="text-sm text-slate-200 leading-relaxed">{response.message}</p>
          </div>

          {response.actions && response.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {response.actions.map((action, i) => (
                <button
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  {action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          Processing command across the swarm...
        </div>
      )}
    </div>
  );
}
