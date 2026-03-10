'use client';

import AICommandBar from '@/components/war-room/AICommandBar';
import OpportunityRadar from '@/components/war-room/OpportunityRadar';
import SwarmActivityFeed from '@/components/war-room/SwarmActivityFeed';
import TerritoryHeatmap from '@/components/war-room/TerritoryHeatmap';
import InitiativeBoard from '@/components/war-room/InitiativeBoard';
import MemoryWidget from '@/components/war-room/MemoryWidget';

export default function WarRoomPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">War Room</h1>
        <p className="mt-1 text-slate-400">
          Real-time command center for your franchise empire
        </p>
      </div>

      {/* Row 1: AI Command Bar — full width */}
      <div>
        <AICommandBar />
      </div>

      {/* Row 2: Opportunity Radar (2/3) + Swarm Activity Feed (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OpportunityRadar />
        </div>
        <div>
          <SwarmActivityFeed />
        </div>
      </div>

      {/* Row 3: Territory Heatmap (1/3) + Initiative Board (2/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <TerritoryHeatmap />
        </div>
        <div className="lg:col-span-2">
          <InitiativeBoard />
        </div>
      </div>

      {/* Row 4: Memory Widget — full width */}
      <div>
        <MemoryWidget />
      </div>
    </div>
  );
}
