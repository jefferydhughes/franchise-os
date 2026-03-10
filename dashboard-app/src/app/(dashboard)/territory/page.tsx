'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Map,
  MapPin,
  Users,
  DollarSign,
  GraduationCap,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { Territory } from '@/types/franchise-os';

const GRADE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  B: { bg: 'bg-blue-500/15',  text: 'text-blue-400',  border: 'border-blue-500/30' },
  C: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  D: { bg: 'bg-red-500/15',   text: 'text-red-400',   border: 'border-red-500/30' },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  return `$${formatNumber(n)}`;
}

export default function TerritoryPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Territory | null>(null);

  const fetchTerritories = useCallback(async () => {
    try {
      const res = await fetch('/api/territories');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const items: Territory[] = (Array.isArray(data) ? data : data.territories ?? [])
        .sort((a: Territory, b: Territory) => b.score - a.score);
      setTerritories(items);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerritories();
  }, [fetchTerritories]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Territories</h1>
        <p className="mt-1 text-slate-400">
          Manage and analyze franchise territories across your network
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Territory Grid */}
        <div className={selected ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading territories...
            </div>
          ) : territories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Map className="w-10 h-10 mb-3 text-slate-600" />
              <p className="text-sm">No territories found</p>
              <p className="text-xs text-slate-600 mt-1">Territories will appear here once created</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {territories.map((territory) => {
                const grade = GRADE_STYLES[territory.grade] ?? GRADE_STYLES.C;
                const isSelected = selected?.id === territory.id;

                return (
                  <button
                    key={territory.id}
                    onClick={() => setSelected(isSelected ? null : territory)}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : `${grade.border} bg-slate-800 hover:bg-slate-800/80`
                    }`}
                  >
                    {/* Name & Grade */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {territory.name}
                        </h4>
                        <p className="text-xs text-slate-500">{territory.region}</p>
                      </div>
                      <span
                        className={`w-8 h-8 rounded-lg ${grade.bg} ${grade.text} flex items-center justify-center text-xs font-bold shrink-0 ml-2`}
                      >
                        {territory.grade}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                        <div
                          className={`h-full rounded-full ${grade.bg.replace('/15', '')} transition-all`}
                          style={{ width: `${Math.min(territory.score, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-300">
                        {territory.score}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatNumber(territory.demographics?.population ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(territory.demographics?.median_income ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {territory.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
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

              {/* Grade Badge */}
              {(() => {
                const grade = GRADE_STYLES[selected.grade] ?? GRADE_STYLES.C;
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${grade.bg} ${grade.text} text-sm font-semibold mb-5`}>
                    Grade {selected.grade} &middot; Score {selected.score}
                  </div>
                );
              })()}

              {/* Status */}
              <div className="mb-5">
                {selected.status === 'assigned' ? (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Assigned to franchisee
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/15 text-green-400 text-xs font-medium">
                    Available
                  </div>
                )}
              </div>

              {/* Demographics */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Demographics
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="w-4 h-4" />
                      Population
                    </span>
                    <span className="text-sm font-medium text-white">
                      {formatNumber(selected.demographics?.population ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <DollarSign className="w-4 h-4" />
                      Median Income
                    </span>
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(selected.demographics?.median_income ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                      Schools
                    </span>
                    <span className="text-sm font-medium text-white">
                      {selected.demographics?.school_count ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <span className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="w-4 h-4" />
                      Households
                    </span>
                    <span className="text-sm font-medium text-white">
                      {formatNumber(selected.demographics?.households ?? 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Score Breakdown
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Family Density</span>
                    <span className="text-white font-medium">
                      {selected.demographics?.family_density_score ?? 0}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(selected.demographics?.family_density_score ?? 0, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm mt-3">
                    <span className="text-slate-400">School Density</span>
                    <span className="text-white font-medium">
                      {selected.demographics?.school_density_score ?? 0}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${Math.min(selected.demographics?.school_density_score ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Region / Geo Info */}
              <div className="mt-5 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />
                  {selected.geo_data?.city && `${selected.geo_data.city}, `}
                  {selected.geo_data?.state && `${selected.geo_data.state}, `}
                  {selected.region}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
