'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Plus,
  X,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { Initiative } from '@/types/franchise-os';

const BRAND_ID = '6b66fd67-aa7e-46ab-9262-60ccfd3339c8'; // skill-samurai

const INITIATIVE_TYPES = [
  'territory_expansion',
  'lead_campaign',
  'franchisee_support',
  'compliance_action',
  'marketing_push',
] as const;

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  territory_expansion: { bg: 'bg-green-500/15', text: 'text-green-400' },
  lead_campaign:       { bg: 'bg-blue-500/15',  text: 'text-blue-400' },
  franchisee_support:  { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  compliance_action:   { bg: 'bg-red-500/15',   text: 'text-red-400' },
  marketing_push:      { bg: 'bg-amber-500/15', text: 'text-amber-400' },
};

const KANBAN_COLUMNS = [
  { key: 'detected',        label: 'Detected' },
  { key: 'recommended',     label: 'Recommended' },
  { key: 'approved',        label: 'Approved' },
  { key: 'in_progress',     label: 'In Progress' },
  { key: 'learning_review', label: 'Learning Review' },
  { key: 'archived',        label: 'Archived' },
] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTypeLabel(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>(INITIATIVE_TYPES[0]);
  const [description, setDescription] = useState('');

  const fetchInitiatives = useCallback(async () => {
    try {
      const res = await fetch(`/api/initiatives?brandId=${BRAND_ID}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInitiatives(Array.isArray(data) ? data : data.initiatives ?? []);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: BRAND_ID,
          title: title.trim(),
          type,
          description: description.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to create');

      // Reset form and refresh
      setTitle('');
      setType(INITIATIVE_TYPES[0]);
      setDescription('');
      setShowForm(false);
      await fetchInitiatives();
    } catch {
      // Silently fail — could add toast notification
    } finally {
      setSubmitting(false);
    }
  };

  const groupedByStatus = KANBAN_COLUMNS.map((col) => ({
    ...col,
    items: initiatives.filter((i) => i.status === col.key),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Initiatives</h1>
          <p className="mt-1 text-slate-400">
            Track and manage strategic initiatives across your franchise network
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Initiative
        </button>
      </div>

      {/* New Initiative Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Create Initiative</h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="initiative-title" className="block text-xs font-medium text-slate-400 mb-1">
                Title
              </label>
              <input
                id="initiative-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Initiative title"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="initiative-type" className="block text-xs font-medium text-slate-400 mb-1">
                Type
              </label>
              <select
                id="initiative-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {INITIATIVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="initiative-desc" className="block text-xs font-medium text-slate-400 mb-1">
                Description
              </label>
              <textarea
                id="initiative-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the initiative..."
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading initiatives...
        </div>
      ) : initiatives.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Lightbulb className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm">No initiatives yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Create your first initiative to get started
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {groupedByStatus.map((column) => (
            <div
              key={column.key}
              className="flex-shrink-0 w-72 rounded-xl border border-slate-700 bg-slate-800/50 p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {column.label}
                </h3>
                <span className="text-xs text-slate-600 font-medium">
                  {column.items.length}
                </span>
              </div>

              {/* Column Items */}
              <div className="space-y-2">
                {column.items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-600">
                    No items
                  </div>
                ) : (
                  column.items.map((initiative) => {
                    const typeStyle = TYPE_STYLES[initiative.type] ?? {
                      bg: 'bg-slate-500/15',
                      text: 'text-slate-400',
                    };

                    return (
                      <div
                        key={initiative.id}
                        className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                      >
                        <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">
                          {initiative.title}
                        </h4>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${typeStyle.bg} ${typeStyle.text}`}
                        >
                          {formatTypeLabel(initiative.type)}
                        </span>

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          {initiative.territory_id && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Territory
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(initiative.created_at)}
                          </span>
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
