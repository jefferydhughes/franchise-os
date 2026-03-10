'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Loader2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Filter,
} from 'lucide-react';
import type { Lead } from '@/types/franchise-os';

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'new',       label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost',      label: 'Lost' },
] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  new:       { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  contacted: { bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  qualified: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  converted: { bg: 'bg-green-500/15',  text: 'text-green-400' },
  lost:      { bg: 'bg-red-500/15',    text: 'text-red-400' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: '50',
      });
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="mt-1 text-slate-400">
          Track and manage franchise leads across all territories
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSelected(null);
          }}
          aria-label="Filter leads by status"
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">
          {total} lead{total !== 1 ? 's' : ''} total
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leads Table */}
        <div className={selected ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <Users className="w-10 h-10 mb-3 text-slate-600" />
                <p className="text-sm">No leads found</p>
                <p className="text-xs text-slate-600 mt-1">
                  {statusFilter !== 'all'
                    ? 'Try changing the status filter'
                    : 'Leads will appear here once captured'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-slate-700 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        Territory
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const statusStyle = STATUS_STYLES[lead.status] ?? {
                        bg: 'bg-slate-500/15',
                        text: 'text-slate-400',
                      };
                      const isSelected = selected?.id === lead.id;

                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelected(isSelected ? null : lead)}
                          className={`border-b border-slate-700/50 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-500/5'
                              : 'hover:bg-slate-700/30'
                          }`}
                          role="row"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelected(isSelected ? null : lead);
                            }
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{lead.name}</div>
                            <div className="text-xs text-slate-500">{lead.email}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{lead.source}</td>
                          <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                            {lead.territory_id ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">
                                  {lead.territory_id.slice(0, 8)}...
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-600">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400" />
                              <span className="text-white font-medium">{lead.score}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                            {formatDate(lead.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Lead Detail Panel */}
        {selected && (
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 sticky top-6">
              {/* Detail Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white truncate">
                  {selected.name}
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close detail panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badge */}
              {(() => {
                const statusStyle = STATUS_STYLES[selected.status] ?? {
                  bg: 'bg-slate-500/15',
                  text: 'text-slate-400',
                };
                return (
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text} mb-5`}
                  >
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                );
              })()}

              {/* Contact Info */}
              <div className="space-y-3 mb-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors truncate"
                    >
                      {selected.email}
                    </a>
                  </div>

                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-300">{selected.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Details */}
              <div className="space-y-3 mb-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Details
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">Source</span>
                    <span className="text-sm font-medium text-white">{selected.source}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">Score</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="text-sm font-medium text-white">{selected.score}</span>
                    </div>
                  </div>

                  {selected.persona && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                      <span className="text-sm text-slate-400">Persona</span>
                      <span className="text-sm font-medium text-white">{selected.persona}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="text-sm text-slate-400">Created</span>
                    <span className="text-sm font-medium text-white">
                      {formatDate(selected.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Territory */}
              {selected.territory_id && (
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    Territory: {selected.territory_id.slice(0, 8)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
