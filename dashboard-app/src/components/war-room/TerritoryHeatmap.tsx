'use client';

import { useState, useEffect, useCallback } from 'react';
import { Map, MapPin, Users, DollarSign, Loader2, ExternalLink } from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  region: string;
  grade: 'A' | 'B' | 'C' | 'D';
  score: number;
  status: string;
  population: number;
  median_income: number;
}

interface TerritoryHeatmapProps {
  brandId: string;
}

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

export default function TerritoryHeatmap({ brandId }: TerritoryHeatmapProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTerritories = useCallback(async () => {
    try {
      const res = await fetch(`/api/territories?brandId=${brandId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const items: Territory[] = (Array.isArray(data) ? data : data.territories ?? [])
        .sort((a: Territory, b: Territory) => b.score - a.score);
      setTerritories(items);
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchTerritories();
  }, [fetchTerritories]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-white">Territory Overview</h3>
        </div>
        <span className="text-xs text-slate-500">
          {territories.length} territor{territories.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Territory Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[420px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading territories...
          </div>
        ) : territories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Map className="w-8 h-8 mb-2 text-slate-600" />
            <p className="text-sm">No territories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {territories.map((territory) => {
              const grade = GRADE_STYLES[territory.grade] ?? GRADE_STYLES.C;

              return (
                <div
                  key={territory.id}
                  className={`p-3 rounded-lg border ${grade.border} bg-slate-900/40 hover:bg-slate-900/60 transition-colors`}
                >
                  {/* Name & Grade */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{territory.name}</h4>
                      <p className="text-[10px] text-slate-500">{territory.region}</p>
                    </div>
                    <span className={`w-7 h-7 rounded-md ${grade.bg} ${grade.text} flex items-center justify-center text-xs font-bold`}>
                      {territory.grade}
                    </span>
                  </div>

                  {/* Score Bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                      <div
                        className={`h-full rounded-full ${grade.bg.replace('/15', '')} transition-all`}
                        style={{ width: `${Math.min(territory.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-300">{territory.score}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatNumber(territory.population)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(territory.median_income)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {territory.status}
                    </span>
                  </div>

                  {/* Map Button */}
                  <button className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    View on Map
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
