'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AICommandBar from '@/components/war-room/AICommandBar';
import OpportunityRadar from '@/components/war-room/OpportunityRadar';
import SwarmActivityFeed from '@/components/war-room/SwarmActivityFeed';
import TerritoryHeatmap from '@/components/war-room/TerritoryHeatmap';
import InitiativeBoard from '@/components/war-room/InitiativeBoard';
import MemoryWidget from '@/components/war-room/MemoryWidget';

const BRAND_ID = '00000000-0000-0000-0000-000000000001'; // placeholder

function DallasDemoButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function runDemo() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/scenarios/dallas', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResult('Dallas scenario complete — redirecting to Initiatives...');
        setTimeout(() => router.push('/initiatives'), 2000);
      } else {
        setResult(`Error: ${data.error || data.details || 'Unknown error'}`);
      }
    } catch (err: any) {
      setResult(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`text-sm ${result.startsWith('Error') || result.startsWith('Failed') ? 'text-red-400' : 'text-amber-400'}`}>
          {result}
        </span>
      )}
      <button
        onClick={runDemo}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            Running...
          </>
        ) : (
          <>{'\u25B6'} Run Dallas Demo</>
        )}
      </button>
    </div>
  );
}

export default function WarRoomPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">War Room</h1>
          <p className="mt-1 text-slate-400">
            Real-time command center for your franchise empire
          </p>
        </div>
        <DallasDemoButton />
      </div>

      {/* Row 1: AI Command Bar — full width */}
      <div>
        <AICommandBar brandId={BRAND_ID} />
      </div>

      {/* Row 2: Opportunity Radar (2/3) + Swarm Activity Feed (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OpportunityRadar brandId={BRAND_ID} />
        </div>
        <div>
          <SwarmActivityFeed brandId={BRAND_ID} />
        </div>
      </div>

      {/* Row 3: Territory Heatmap (1/3) + Initiative Board (2/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <TerritoryHeatmap brandId={BRAND_ID} />
        </div>
        <div className="lg:col-span-2">
          <InitiativeBoard brandId={BRAND_ID} />
        </div>
      </div>

      {/* Row 4: Memory Widget — full width */}
      <div>
        <MemoryWidget brandId={BRAND_ID} />
      </div>
    </div>
  );
}
