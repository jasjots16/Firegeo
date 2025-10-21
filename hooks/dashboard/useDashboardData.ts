import { useMemo, useState } from 'react';

export interface Metrics {
  shareOfVoice: number; // percent
  brandMentions: number; // percent
  sentiment: number; // delta percent
  totalPrompts: number;
}

export interface MentionsByModelItem {
  label: string;
  value: number; // used to compute bar width proportionally
}

export interface DonutData {
  positive: number;
  neutral: number;
  negative?: number;
}

export interface CompetitorRow {
  name: string;
  visibilityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  shareOfVoice: number;
}

export interface SourceRow {
  domain: string;
  mentions: number;
  sparkline: number[]; // last N points for sparkline
}

export interface DashboardData {
  brandName: string;
  metrics: Metrics;
  mentionsByModel: MentionsByModelItem[];
  donut: DonutData;
  competitors: CompetitorRow[];
  sources: SourceRow[];
  trendSeries: { date: string; mentions: number }[];
}

export function useDashboardData(initial?: Partial<DashboardData>) {
  // In real impl, replace with React Query fetching using jobId/url
  const [data] = useState<DashboardData>(() => ({
    brandName: initial?.brandName || 'Brand Name',
    metrics: initial?.metrics || {
      shareOfVoice: 65.3,
      brandMentions: 55.8,
      sentiment: 50.0,
      totalPrompts: 12,
    },
    mentionsByModel: initial?.mentionsByModel || [
      { label: 'Google', value: 72 },
      { label: 'ChatGPT', value: 58 },
      { label: 'AI Mode', value: 35 },
      { label: 'Other', value: 22 },
    ],
    donut: initial?.donut || { positive: 40, neutral: 60 },
    competitors: initial?.competitors || [
      { name: 'Welzin', visibilityScore: 78, sentiment: 'positive', shareOfVoice: 28 },
      { name: 'Octane', visibilityScore: 65, sentiment: 'neutral', shareOfVoice: 19 },
      { name: 'Nimbus', visibilityScore: 52, sentiment: 'negative', shareOfVoice: 12 },
    ],
    sources: initial?.sources || [
      { domain: 'reddit.com', mentions: 124, sparkline: [5,8,6,7,12,10,11,9,8,12] },
      { domain: 'amazon.com', mentions: 88, sparkline: [2,4,5,4,6,7,6,7,8,9] },
      { domain: 'wikipedia.org', mentions: 73, sparkline: [1,2,2,3,4,5,4,6,5,5] },
    ],
    trendSeries: initial?.trendSeries || Array.from({ length: 12 }).map((_, i) => ({
      date: `2025-${String(i + 1).padStart(2, '0')}`,
      mentions: Math.round(20 + Math.random() * 80),
    })),
  }));

  const maxBar = useMemo(() => Math.max(...data.mentionsByModel.map(m => m.value), 1), [data.mentionsByModel]);

  return { data, maxBar };
}
