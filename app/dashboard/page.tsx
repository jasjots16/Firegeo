"use client";
/**
README (summary of changes)
- Added a new dashboard UI at app/dashboard/page.tsx which composes small components under components/dashboard/*
- Components: TopHeader, LeftNav, MetricsRow, MentionsByModel, CompetitorBenchmarks, TopSources, DonutChart, Sparkline
- Hook: hooks/dashboard/useDashboardData.ts provides mock data and a stable shape for future API replacement
Run locally: next dev as usual; navigate to /dashboard to view the new UI.
*/

import React, { useCallback, useState } from 'react';
import { TopHeader } from '@/components/dashboard/TopHeader';
import { LeftNav } from '@/components/dashboard/LeftNav';
import { MetricsRow } from '@/components/dashboard/MetricsRow';
import { MentionsByModel } from '@/components/dashboard/MentionsByModel';
import { CompetitorBenchmarks } from '@/components/dashboard/CompetitorBenchmarks';
import { TopSources } from '@/components/dashboard/TopSources';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';
import Image from "next/image";

export default function DashboardPage() {
  const { data, maxBar } = useDashboardData();
  const [active, setActive] = useState<'brand-monitor' | 'aeo-report' | 'files' | 'ugc'>('aeo-report'); // default AEO active

  const onNavigate = useCallback((key: typeof active) => {
    setActive(key);
    // TODO: route navigation if needed
  }, []);

  const onCompare = useCallback(() => {
    alert('Compare with Competitor (stub)');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        brandName={''}
        logo={
          <Image
            src="/firecrawl-logo-with-fire.png"
            alt="Firecrawl"
            width={180}
            height={37}
            priority
          />
        }
      />

      <LeftNav active={active} onNavigate={onNavigate} brandName={data.brandName} />

      <main className="pt-16 ml-0 md:ml-64">
        <div className="max-w-7xl mx-auto p-6">
          {/* Content Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Overview</h1>
            {/* Small card for Total Prompts in the top-right of content area */}
            <div className="hidden sm:block rounded-2xl border shadow-md px-4 py-3 text-center">
              <div className="text-xs text-gray-500">Total Prompts</div>
              <div className="text-xl font-semibold">{data.metrics.totalPrompts}</div>
            </div>
          </div>

          {/* Metrics Row */}
          <MetricsRow
            shareOfVoice={data.metrics.shareOfVoice}
            brandMentions={data.metrics.brandMentions}
            sentiment={data.metrics.sentiment}
            totalPrompts={data.metrics.totalPrompts}
          />

          {/* Two-column grid below metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <MentionsByModel items={data.mentionsByModel} max={maxBar} donutPercent={40} />
              <TopSources sources={data.sources} trendSeries={data.trendSeries} />
            </div>
            <div className="lg:col-span-1">
              <CompetitorBenchmarks rows={data.competitors} onCompare={onCompare} />
            </div>
          </div>
        </div>
      </main>

      {/* Responsive behavior: hide LeftNav or make slim would need more logic; keep simple for now */}
    </div>
  );
}
